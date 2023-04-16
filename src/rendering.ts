import { format, parseISO, formatISO } from "date-fns";
import * as nunjucks from "nunjucks";
import { Annotation, FeedEntry } from "./api";

const renderer = new nunjucks.Environment(null, { trimBlocks: true, autoescape: false });
renderer.addFilter("date", (str, fmt) => {
  return format(parseISO(str), fmt);
});
renderer.addFilter("isoDate", (str) => {
  return formatISO(parseISO(str));
});
renderer.addFilter("removeNewlines", (str) => {
  return str.replace(/\n+/g, " ")
    .trim();
});

const METADATA_TEMPLATE = `- tana_input_source_{{content.id}} #[[#article ⇤]]
    - id:: {{content.id}}
    - title::
        - {{content.title}}
{% if content.author %}
    - author:: [[{{content.author.any_name}} #author]]
{% elif content.publisher %}
    - author:: [[{{content.publisher.any_name}} #author]]
{% endif %}
    - app:: [[Matter]]
    - source_url:: {{content.url}}
{% if content.photo_thumbnail_url %}
    - image:: ![]({{content.photo_thumbnail_url}})
{% elif content.publisher.domain_photo %}
    - image:: ![]({{content.publisher.domain_photo}})
{% endif %}
    - Imported Highlights`;

const HIGHLIGHT_TEMPLATE = `        - tana_input_highlight_{{id}} #[[tana-input-highlight]]
            - id:: {{id}}
            - text:: {{text}}
            - note::
                - {{note|removeNewlines()}} #[[raw-note]]
            - day_highlighted:: [[date:{{created_date|isoDate()}}]]
`;

const LAYOUT_TEMPLATE =
`%%tana%%
{{metadata}}
{{highlights}}
`;

const METADATA_TEMPLATE_OLD = `
## Metadata
* URL: [{{url}}]({{url}})
{% if author %}
* Author: {{author}}
{% endif %}
{% if publisher %}
* Publisher: {{publisher}}
{% endif %}
{% if published_date %}
* Published Date: {{published_date|date("yyyy-MM-dd")}}
{% endif %}
{% if note %}
* Note: {{note}}
{% endif %}
{% if tags %}
* Tags: {% for tag in tags %}#{{tag | replace(' ', '_')}}{% if not loop.last %}, {% endif %}{% endfor%}
{% endif %}
`;

const HIGHLIGHT_TEMPLATE_OLD = `
* {{text}}
{% if note %}
  * **Note**: {{note}}
{% endif %}
`;

export function renderFeedEntry(feedEntry: FeedEntry): string {
  let metadata;
  try {
    metadata = _renderMetadata(feedEntry);
  } catch (error) {
    console.error(error);
    throw new Error("There was a problem with your Matter metadata template. Please update it in settings.");
  }

  let highlights;
  try {
    const annotations = feedEntry.content.my_annotations.sort((a, b) => a.word_start - b.word_start);
    highlights = annotations.map((a) => _renderAnnotation(a)).join("");
  } catch (error) {
    console.error(error);
    throw new Error("There was a problem with your Matter highlight template. Please update it in settings.");
  }

  try {
    return renderer.renderString(LAYOUT_TEMPLATE, {
      title: feedEntry.content.title,
      metadata: metadata,
      highlights: highlights,
    });
  } catch (error) {
    console.error(error);
    throw new Error("There was a problem with your Matter template. Please update it in settings.");
  }
}

function _renderMetadata(feedEntry: FeedEntry): string {
  const template = METADATA_TEMPLATE;

  let publishedDate: string | null = null;
  if (feedEntry.content.publication_date) {
    publishedDate = feedEntry.content.publication_date;
  }

  return renderer.renderString(template, {content: feedEntry.content});
  // {
  //   author: feedEntry.content.author?.any_name,
  //   note: feedEntry.content.my_note?.note,
  //   published_date: publishedDate,
  //   publisher: feedEntry.content.publisher?.any_name,
  //   tags: feedEntry.content.tags.map((t) => t.name),
  //   title: feedEntry.content.title,
  //   url: feedEntry.content.url,
  // });
}

function _renderAnnotation(annotation: Annotation) {
  const template = HIGHLIGHT_TEMPLATE;

  return renderer.renderString(template, {...annotation});
}


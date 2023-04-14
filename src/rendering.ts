import { format, parseISO } from "date-fns";
import * as nunjucks from "nunjucks";
import { Annotation, FeedEntry } from "./api";

const renderer = new nunjucks.Environment(null, { trimBlocks: true, autoescape: false });
renderer.addFilter("date", (str, fmt) => {
  return format(parseISO(str), fmt);
});

const LAYOUT_TEMPLATE = `
{{metadata}}

## Highlights
{{highlights}}
`;

const METADATA_TEMPLATE = `
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

const HIGHLIGHT_TEMPLATE = `
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
    return renderer.renderString(LAYOUT_TEMPLATE.trim(), {
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

  return renderer.renderString(template.trim(), {
    author: feedEntry.content.author?.any_name,
    note: feedEntry.content.my_note?.note,
    published_date: publishedDate,
    publisher: feedEntry.content.publisher?.any_name,
    tags: feedEntry.content.tags.map((t) => t.name),
    title: feedEntry.content.title,
    url: feedEntry.content.url,
  });
}

function _renderAnnotation(annotation: Annotation) {
  const template = HIGHLIGHT_TEMPLATE;

  return renderer.renderString(template.trim(), {...annotation});
}


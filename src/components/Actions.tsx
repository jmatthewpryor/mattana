import { ActionPanel, Action, Icon, Toast, showToast } from "@raycast/api";
import { FeedEntry } from "../api";
import { renderFeedEntry } from "../rendering";

export function Actions(props: {item: FeedEntry}) {

  return (
    <ActionPanel title={props.item.content.title}>
      <ActionPanel.Section>
        {/* COPY TANA */}
        {props.item.content.url && (
          <Action.CopyToClipboard
            content={renderFeedEntry(props.item)}
            title="Copy as Tana Paste"
            shortcut={{ modifiers: ["cmd"], key: "." }}
          />
        )}
        {/* OPEN IN MATTER */}
        {props.item.content.title && props.item.id && (
          <Action.OpenInBrowser url={props.item.content.url} title="Open in Browser" />
        )}
        {/* COPY JSON */}
        {props.item.content.url && (
          <Action.CopyToClipboard
            content={JSON.stringify(props.item)}
            title="Copy as JSON"
            shortcut={{ modifiers: ["cmd","shift"], key: "j" }}
          />
        )}
        {/* FAVORITE ARTICLE */}
        {props.item.id && (
          <Action
            title="Add to favorites"
            icon={Icon.Star}
            onAction={async () => {
              await showToast(Toast.Style.Animated, "Loading");
            }}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
          />
        )}
        {/* UNFAVORITE ARTICLE */}
        {props.item.id && (
          <Action
            title="Remove from favorites"
            icon={Icon.StarDisabled}
            onAction={async () => {
              await showToast(Toast.Style.Animated, "Loading");
            }}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
          />
        )}
      </ActionPanel.Section>
    </ActionPanel>
  );
}

import { ActionPanel, Action, Icon, Toast, showToast } from "@raycast/api";
import { FeedEntry } from "../api";
import { renderFeedEntry } from "../rendering";

export function Actions(props: {item: FeedEntry}) {

  return (
    <ActionPanel title={props.item.content.title}>
      <ActionPanel.Section>
        {/* OPEN IN MATTER */}
        {props.item.content.title && props.item.id && (
          <Action.OpenInBrowser url={props.item.content.url} title="Open in Matter" />
        )}
        {/* View Original */}
        {props.item.content.url && <Action.OpenInBrowser url={props.item.content.url} title="View Original" />}
        {/* COPY LINK */}
        {props.item.content.url && (
          <Action.CopyToClipboard
            content={renderFeedEntry(props.item) + "\n" + JSON.stringify(props.item)}
            title="Copy Link"
            shortcut={{ modifiers: ["cmd"], key: "." }}
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

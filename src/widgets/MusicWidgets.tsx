import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';
import { buildWidgetUri } from '@/utils/widgetLinks';
import { EMPTY_WIDGET_DATA, WidgetTheme, type WidgetData } from './widgetData';

const ICON_PREV = '\u23EE';
const ICON_NEXT = '\u23ED';
const ICON_PLAY = '\u25B6';
const ICON_PAUSE = '\u2759\u2759';

type Props = { data?: WidgetData };

function ControlButton({
  label,
  uri,
  primary,
  size = 40,
}: {
  label: string;
  uri: string;
  primary?: boolean;
  size?: number;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? WidgetTheme.accent : WidgetTheme.surface,
      }}
    >
      <TextWidget
        text={label}
        style={{ fontSize: primary ? 18 : 14, color: primary ? WidgetTheme.accentInk : WidgetTheme.text }}
      />
    </FlexWidget>
  );
}

function NowPlayingText({ data, compact }: { data: WidgetData; compact?: boolean }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: buildWidgetUri({ action: 'open' }) }}
      style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}
    >
      <TextWidget
        text={data.title}
        truncate="END"
        maxLines={1}
        style={{ fontSize: compact ? 14 : 16, fontWeight: '700', color: WidgetTheme.text }}
      />
      <TextWidget
        text={data.artist}
        truncate="END"
        maxLines={1}
        style={{ fontSize: compact ? 11 : 13, color: WidgetTheme.textMuted, marginTop: 2 }}
      />
    </FlexWidget>
  );
}

/** Small 2x1 widget: title + play/pause + next. */
export function MusicWidgetSmall({ data = EMPTY_WIDGET_DATA }: Props) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WidgetTheme.bg,
        borderRadius: 20,
        paddingHorizontal: 14,
      }}
    >
      <NowPlayingText data={data} compact />
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        <ControlButton
          label={data.isPlaying ? ICON_PAUSE : ICON_PLAY}
          uri={buildWidgetUri({ action: 'playpause' })}
          primary
          size={40}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Medium 4x2 widget: now playing + full transport controls. */
export function MusicWidgetMedium({ data = EMPTY_WIDGET_DATA }: Props) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: WidgetTheme.bg,
        borderRadius: 24,
        padding: 16,
      }}
    >
      <NowPlayingText data={data} />
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 14,
        }}
      >
        <ControlButton label={ICON_PREV} uri={buildWidgetUri({ action: 'previous' })} size={44} />
        <FlexWidget style={{ width: 14, height: 1 }} />
        <ControlButton
          label={data.isPlaying ? ICON_PAUSE : ICON_PLAY}
          uri={buildWidgetUri({ action: 'playpause' })}
          primary
          size={54}
        />
        <FlexWidget style={{ width: 14, height: 1 }} />
        <ControlButton label={ICON_NEXT} uri={buildWidgetUri({ action: 'next' })} size={44} />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Large 4x4 widget: now playing header + scrollable, tappable song list. */
export function MusicWidgetLarge({ data = EMPTY_WIDGET_DATA }: Props) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: WidgetTheme.bg,
        borderRadius: 24,
        padding: 14,
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <NowPlayingText data={data} />
        <ControlButton label={ICON_PREV} uri={buildWidgetUri({ action: 'previous' })} size={40} />
        <FlexWidget style={{ width: 8, height: 1 }} />
        <ControlButton
          label={data.isPlaying ? ICON_PAUSE : ICON_PLAY}
          uri={buildWidgetUri({ action: 'playpause' })}
          primary
          size={46}
        />
        <FlexWidget style={{ width: 8, height: 1 }} />
        <ControlButton label={ICON_NEXT} uri={buildWidgetUri({ action: 'next' })} size={40} />
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          height: 1,
          backgroundColor: WidgetTheme.border,
          marginTop: 12,
          marginBottom: 6,
        }}
      />

      <ListWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: WidgetTheme.bgList,
        }}
      >
        {data.songs.length === 0 ? (
          <FlexWidget style={{ width: 'match_parent', padding: 16, alignItems: 'center' }}>
            <TextWidget
              text="No songs yet. Play something in the app."
              style={{ fontSize: 13, color: WidgetTheme.textMuted }}
            />
          </FlexWidget>
        ) : (
          data.songs.map((song) => (
            <FlexWidget
              key={song.id}
              clickAction="OPEN_URI"
              clickActionData={{ uri: buildWidgetUri({ action: 'play', songId: song.id }) }}
              style={{
                width: 'match_parent',
                height: 56,
                flexDirection: 'column',
                justifyContent: 'center',
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <TextWidget
                text={song.title}
                truncate="END"
                maxLines={1}
                style={{ fontSize: 14, fontWeight: '600', color: WidgetTheme.text }}
              />
              <TextWidget
                text={song.artist}
                truncate="END"
                maxLines={1}
                style={{ fontSize: 11, color: WidgetTheme.textMuted, marginTop: 1 }}
              />
            </FlexWidget>
          ))
        )}
      </ListWidget>
    </FlexWidget>
  );
}

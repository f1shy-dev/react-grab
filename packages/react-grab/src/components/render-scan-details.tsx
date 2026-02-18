import { Show, createMemo, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import type {
  RenderScanDetailsState,
  ScanCopyPresetModeMap,
} from "../types.js";
import {
  PANEL_STYLES,
  RENDER_SCAN_DETAILS_ATTRIBUTE,
  RENDER_SCAN_DETAILS_ESTIMATED_HEIGHT_PX,
  RENDER_SCAN_DETAILS_MAX_WIDTH_PX,
  RENDER_SCAN_DETAILS_MIN_WIDTH_PX,
  RENDER_SCAN_DETAILS_OFFSET_PX,
  RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX,
  SELECTION_LABEL_OFFSCREEN_PX,
} from "../constants.js";
import { cn } from "../utils/cn.js";
import { clampToViewport } from "../utils/clamp-to-viewport.js";
import { isEventFromOverlay } from "../utils/is-event-from-overlay.js";

interface RenderScanDetailsProps {
  details: RenderScanDetailsState | null;
  onDismiss?: () => void;
  onCopyComponent?: (
    componentKey: string,
    mode: keyof ScanCopyPresetModeMap,
  ) => void;
}

const formatDurationText = (durationMs: number): string =>
  `${durationMs.toFixed(2)}ms`;

export const RenderScanDetails: Component<RenderScanDetailsProps> = (props) => {
  const popupWidth = () =>
    Math.min(
      RENDER_SCAN_DETAILS_MAX_WIDTH_PX,
      Math.max(
        RENDER_SCAN_DETAILS_MIN_WIDTH_PX,
        window.innerWidth - RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX * 2,
      ),
    );

  const anchoredPosition = createMemo(() => {
    const details = props.details;
    if (!details) {
      return {
        left: SELECTION_LABEL_OFFSCREEN_PX,
        top: SELECTION_LABEL_OFFSCREEN_PX,
      };
    }

    const width = popupWidth();
    const rawLeft = details.anchorX - width * 0.5;
    const rawTop = details.anchorY + RENDER_SCAN_DETAILS_OFFSET_PX;

    const maxTop =
      window.innerHeight -
      RENDER_SCAN_DETAILS_ESTIMATED_HEIGHT_PX -
      RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX;

    return {
      left: clampToViewport(
        rawLeft,
        width,
        window.innerWidth,
        RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX,
      ),
      top: Math.min(
        Math.max(rawTop, RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX),
        Math.max(RENDER_SCAN_DETAILS_VIEWPORT_MARGIN_PX, maxTop),
      ),
    };
  });

  onMount(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (!props.details) return;
      if (event.code !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      props.onDismiss?.();
    };
    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (!props.details) return;
      if (isEventFromOverlay(event, RENDER_SCAN_DETAILS_ATTRIBUTE)) return;
      props.onDismiss?.();
    };

    window.addEventListener("keydown", handleEscape, { capture: true });
    window.addEventListener("mousedown", handleOutsideMouseDown, {
      capture: true,
    });
    onCleanup(() => {
      window.removeEventListener("keydown", handleEscape, { capture: true });
      window.removeEventListener("mousedown", handleOutsideMouseDown, {
        capture: true,
      });
    });
  });

  return (
    <Show when={props.details}>
      {(details) => (
        <div
          data-react-grab-ignore-events
          data-react-grab-render-scan-details
          class={cn(
            "fixed rounded-[10px] border border-black/10 shadow-[0px_1px_2px_#51515140] [corner-shape:superellipse(1.25)] p-2 text-[10px] leading-[1.25] text-black/80 select-none",
            PANEL_STYLES,
          )}
          style={{
            left: `${anchoredPosition().left}px`,
            top: `${anchoredPosition().top}px`,
            width: `${popupWidth()}px`,
            "z-index": "2147483647",
            "pointer-events": "auto",
          }}
        >
          <div class="font-medium text-black text-[11px] truncate">
            {details().component.componentName}
          </div>
          <div class="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
            <span>Renders</span>
            <span class="text-black text-right">
              {details().component.renderCount}
            </span>
            <span>Avg render</span>
            <span class="text-black text-right">
              {formatDurationText(details().component.avgRenderTimeMs)}
            </span>
            <span>Max render</span>
            <span class="text-black text-right">
              {formatDurationText(details().component.maxRenderTimeMs)}
            </span>
            <span>Effects</span>
            <span class="text-black text-right">
              {formatDurationText(details().component.totalEffectTimeMs)}
            </span>
            <span>Layout effects</span>
            <span class="text-black text-right">
              {formatDurationText(details().component.totalLayoutEffectTimeMs)}
            </span>
          </div>
          <div class="mt-2">
            <div class="text-black/55">Unstable props</div>
            <div class="text-black truncate">
              {details().component.unstableProps.length > 0
                ? details().component.unstableProps.join(", ")
                : "None"}
            </div>
          </div>
          <div class="mt-2">
            <div class="text-black/55">Source</div>
            <div class="text-black truncate">
              {(() => {
                const componentSource = details().component.source;
                if (!componentSource) {
                  return "Unknown";
                }
                const lineNumberSuffix = componentSource.lineNumber
                  ? `:${componentSource.lineNumber}`
                  : "";
                return `${componentSource.filePath}${lineNumberSuffix}`;
              })()}
            </div>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-1">
            <button
              data-react-grab-ignore-events
              data-react-grab-render-scan-details
              class="px-2 py-1 rounded-[7px] text-left bg-black/5 hover:bg-black/10 text-black cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onCopyComponent?.(
                  details().component.componentKey,
                  "issues",
                );
              }}
            >
              Copy issues
            </button>
            <button
              data-react-grab-ignore-events
              data-react-grab-render-scan-details
              class="px-2 py-1 rounded-[7px] text-left bg-black/5 hover:bg-black/10 text-black cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onCopyComponent?.(details().component.componentKey, "all");
              }}
            >
              Copy all
            </button>
            <button
              data-react-grab-ignore-events
              data-react-grab-render-scan-details
              class="px-2 py-1 rounded-[7px] text-left bg-black/5 hover:bg-black/10 text-black cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onCopyComponent?.(
                  details().component.componentKey,
                  "unstable-props-only",
                );
              }}
            >
              Copy unstable
            </button>
            <button
              data-react-grab-ignore-events
              data-react-grab-render-scan-details
              class="px-2 py-1 rounded-[7px] text-left bg-black/5 hover:bg-black/10 text-black cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onCopyComponent?.(
                  details().component.componentKey,
                  "layout-effects-only",
                );
              }}
            >
              Copy layout
            </button>
          </div>
        </div>
      )}
    </Show>
  );
};
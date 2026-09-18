const LOCAL_FLOW_ASSET_PATTERN =
  /^\/uploads\/flows\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(logo|background)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

export type LocalFlowAssetKind = "logo" | "background";

export function isHttpAssetUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseLocalFlowAssetPath(value: string) {
  const match = LOCAL_FLOW_ASSET_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return {
    flowId: match[1],
    kind: match[2] as LocalFlowAssetKind
  };
}

export function isAllowedFlowAssetReference(value: string) {
  return isHttpAssetUrl(value) || parseLocalFlowAssetPath(value) !== null;
}

type WheelDelta = Pick<WheelEvent, "shiftKey" | "deltaX" | "deltaY">;

export function getHorizontalWheelDelta({ shiftKey, deltaX, deltaY }: WheelDelta): number {
  return deltaX || (shiftKey ? deltaY : 0);
}

import React, { useEffect, useCallback, useRef } from "react";

const { pow, sqrt, sign } = Math;

export const useScroller = (
  scrollerRef,
  onChange,
  shouldWrap = true,
  shouldCenter = shouldWrap
) => {
  const isWindow = !scrollerRef;

  const currentRef = useRef({
    x: 0,
    y: 0,
    xChange: 0,
    yChange: 0,
    distanceChange: 0,
    xRatio: 0,
    yRatio: 0,
    xScrollable: 0,
    yScrollable: 0,
    viewportWidth: 0,
    viewportHeight: 0,
  });
  const lastRef = useRef({ ...currentRef.current });
  let skipNext = useRef(false);

  const centerScroller = useCallback(() => {
    const scroller = isWindow ? document.scrollingElement : scrollerRef.current;
    const current = currentRef.current;
    skipNext.current = true;
    scroller.scrollTo(current.xScrollable / 2, current.yScrollable / 2);
  }, [isWindow, scrollerRef]);

  const handleCamera = useCallback(() => {
    const scroller = isWindow ? document.scrollingElement : scrollerRef.current;
    const current = currentRef.current;
    const last = lastRef.current;

    const x = isWindow ? window.pageXOffset : scroller.scrollLeft;
    const y = isWindow ? window.pageYOffset : scroller.scrollTop;

    const closeToEdge =
      shouldWrap &&
      (x < current.xScrollable / 10 ||
        x > current.xScrollable * 0.9 ||
        y < current.yScrollable / 10 ||
        y > current.yScrollable * 0.9);

    if (closeToEdge) {
      centerScroller();
    } else {
      if (x !== last.x || y !== last.y) {
        current.x = x;
        current.y = y;
        current.xRatio = x / current.xScrollable;
        current.yRatio = y / current.yScrollable;
        current.xChange = x - last.x;
        current.yChange = y - last.y;
        current.distanceChange =
          sqrt(pow(current.xChange, 2) + pow(current.yChange, 2)) *
          sign(current.xChange + current.yChange);

        if (skipNext.current) {
          skipNext.current = false;
        } else {
          onChange(current);
        }
        Object.assign(last, current);
      }
    }
  }, [scrollerRef, isWindow, centerScroller, onChange, shouldWrap]);

  useEffect(() => {
    const scroller = isWindow ? document.scrollingElement : scrollerRef.current;

    const handleResize = () => {
      const current = currentRef.current;
      // FIXME: Firefox uses the total scrollable height as height, for some reason
      // const { width, height } = scroller.getBoundingClientRect();
      const width = window.innerWidth;
      const height = window.innerHeight;
      current.viewportWidth = width;
      current.viewportHeight = height;
      current.xScrollable = (isWindow ? document.body.scrollWidth : scroller.scrollWidth) - width;
      current.yScrollable =
        (isWindow ? document.body.scrollHeight : scroller.scrollHeight) - height;
      handleCamera();
    };

    (isWindow ? window : scroller).addEventListener("scroll", handleCamera);
    (isWindow ? window : scroller).addEventListener("resize", handleResize);

    handleResize();

    return () => {
      scroller.removeEventListener("scroll", handleCamera);
      scroller.removeEventListener("resize", handleResize);
    };
  }, [scrollerRef, isWindow, handleCamera]);

  useEffect(() => {
    if (shouldCenter) {
      centerScroller();
    }
  }, [shouldCenter, centerScroller]);
};

export const Scroller = ({ children, refToUse, height = "500vh", width = "800vw" }) => {
  return (
    <div className="Scroller-scroller" ref={refToUse}>
      {height && width && <div className="Scroller-scrollArea" style={{ height, width }}></div>}
      {children}
    </div>
  );
};

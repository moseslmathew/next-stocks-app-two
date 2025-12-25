import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CrosshairMode, 
  LineStyle, 
  AreaSeries, 
  HistogramSeries,
  TickMarkType
} from 'lightweight-charts';

interface TradingViewChartProps {
  data: { time: number; value: number }[];
  volumeData: { time: number; value: number; color: string }[];
  chartColor: string;
  showVolume: boolean;
  referencePrice?: number;
  visibleRange: string;
  initialVisibleRange?: { from: number; to: number };
  timezone?: string;
  onCrosshairMove?: (data: { price: number; volume: number; timestamp: number } | null) => void;
}

export interface TradingViewChartHandle {
    resetChart: (range?: { from: number; to: number }) => void;
}

export const TradingViewChart = forwardRef<TradingViewChartHandle, TradingViewChartProps>(({
  data,
  volumeData,
  chartColor,
  showVolume,
  referencePrice,
  visibleRange,
  initialVisibleRange,
  timezone,
  onCrosshairMove,
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const rangeRef = useRef(initialVisibleRange);
  useEffect(() => { rangeRef.current = initialVisibleRange; }, [initialVisibleRange]);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const priceLineRef = useRef<any>(null);
  const initialRangeSet = React.useRef(false);
  // Reset flag when visibleRange changes (e.g., user switches 1d/52w)
  React.useEffect(() => {
    initialRangeSet.current = false;
  }, [visibleRange]);

  useImperativeHandle(ref, () => ({
      resetChart: (range) => {
          if (chartRef.current) {
              // Priority: Passed range > Prop range (if 1d) > Fit Content
              const targetRange = range || (visibleRange === '1d' ? initialVisibleRange : undefined);
              
              if (targetRange) {
                  chartRef.current.timeScale().setVisibleRange(targetRange as any);
              } else {
                  chartRef.current.timeScale().fitContent();
              }
          }
          // Reset flag so next data update can re‑apply initial range if needed
          initialRangeSet.current = false;
      }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.15)', style: LineStyle.Solid },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)', style: LineStyle.Dotted },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      // Disable interaction (scrolling/zooming) to fix the graph position
      handleScroll: false,
      handleScale: false,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        // Give a small right offset? No, user wants consistent scaling.
        rightOffset: 0,
      },
      rightPriceScale: {
        minimumWidth: 55, // Optimized width to save space
        autoScale: true,
        borderVisible: false,
        scaleMargins: {
            top: 0.1,
            bottom: showVolume ? 0.2 : 0.1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
            labelVisible: false,
            style: LineStyle.Dashed,
            color: '#9ca3af',
        },
        horzLine: {
            labelVisible: true,
            style: LineStyle.Dashed,
            color: '#9ca3af',
        }
      },

    });

    // Check price level to determine if precision is needed
    // Use the last data point as reference for current price
    const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
    const isPennyStock = latestValue < 20 && latestValue > 0;

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: chartColor,
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineColor: chartColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: isPennyStock ? {
          type: 'price',
          precision: 2,
          minMove: 0.01,
      } : {
          type: 'price',
          precision: 0,
          minMove: 1,
      },
    });
    
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', 
    });
    
    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.8, 
            bottom: 0,
        },
    });

    areaSeriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;
    chartRef.current = chart;

    chart.subscribeCrosshairMove((param) => {
        if (!onCrosshairMove) return;
        
        if (
            param.point === undefined ||
            !param.time ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current!.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current!.clientHeight
        ) {
            onCrosshairMove(null);
        } else {
            const priceData = param.seriesData.get(areaSeries) as { value: number; time: number } | undefined;
            const volumeData = param.seriesData.get(volumeSeries) as { value: number; time: number } | undefined;
            
            if (priceData) {
                onCrosshairMove({
                    price: priceData.value,
                    volume: volumeData ? volumeData.value : 0,
                    timestamp: (param.time as number) * 1000, 
                });
            }
        }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      chart.remove();
      resizeObserver.disconnect();
    };
  }, []); 

  // Format axis based on range
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Intraday (1d) or Short term (1w) -> Show Time
    const isIntraday = visibleRange === '1d' || visibleRange === '1w';

    chartRef.current.applyOptions({
        timeScale: {
            tickMarkFormatter: (time: number, tickMarkType: TickMarkType, locale: string) => {
                const date = new Date(time * 1000);
                const options: Intl.DateTimeFormatOptions = { timeZone: timezone };

                // Show Date for the session start tick (1D view)
                if (rangeRef.current && time === rangeRef.current.from) {
                    return date.toLocaleDateString(locale, { ...options, day: 'numeric', month: 'short' });
                }
                
                // Use TickMarkType to decide format (Day vs Time)
                if (tickMarkType === TickMarkType.DayOfMonth || tickMarkType === TickMarkType.Month || tickMarkType === TickMarkType.Year) {
                     // Include Year if range is long (> 3m) or explicitly requested
                     const showYear = ['1y', '2y', '5y', 'max'].includes(visibleRange || '');
                     return date.toLocaleDateString(locale, { 
                         ...options, 
                         month: 'short', 
                         day: 'numeric',
                         year: showYear ? '2-digit' : undefined
                     });
                }
                
                return date.toLocaleTimeString(locale, { ...options, hour: '2-digit', minute: '2-digit', hour12: false });
            },
        }
    });
  }, [visibleRange, timezone]);

  useEffect(() => {
    if (chartRef.current) {
        chartRef.current.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: showVolume ? 0.2 : 0.1,
            }
        });
        setSelectionBox(null);
        setSelectionPath('');
        setSelectionStats(null);
        setCrosshairPoint(null);
    }
  }, [showVolume]);
  
  useEffect(() => {
    if (areaSeriesRef.current && data) {
         areaSeriesRef.current.setData(data as any); 
         if (chartRef.current && data.length > 0) {
             if (initialVisibleRange && visibleRange === '1d') {
                 chartRef.current.timeScale().setVisibleRange(initialVisibleRange as any);
             } else {
                 chartRef.current.timeScale().fitContent();
             }
         }
    }
  }, [data, initialVisibleRange, visibleRange]);

  useEffect(() => {
    if (volumeSeriesRef.current && volumeData) {
        if (showVolume) {
            volumeSeriesRef.current.applyOptions({ visible: true });
            volumeSeriesRef.current.setData(volumeData as any);
        } else {
            volumeSeriesRef.current.applyOptions({ visible: false });
        }
    }
  }, [volumeData, showVolume]);



  useEffect(() => {
      if (areaSeriesRef.current) {
          areaSeriesRef.current.applyOptions({
              topColor: chartColor.startsWith('#') ? `${chartColor}66` : chartColor,
              lineColor: chartColor,
          });
      }
  }, [chartColor]);

  useEffect(() => {
     if (!areaSeriesRef.current) return;

     if (priceLineRef.current) {
         areaSeriesRef.current.removePriceLine(priceLineRef.current);
         priceLineRef.current = null;
     }

     if (referencePrice !== undefined) {
         priceLineRef.current = areaSeriesRef.current.createPriceLine({
             price: referencePrice,
             color: '#9ca3af',
             lineWidth: 1,
             lineStyle: LineStyle.Dotted,
             axisLabelVisible: true,
             title: 'Prev Close',
         });
     }
  }, [referencePrice]);

  const [crosshairPoint, setCrosshairPoint] = React.useState<{ x: number; y: number } | null>(null);

  const updateCrosshairData = (x: number) => {
      if (!chartRef.current || !areaSeriesRef.current || !data.length || !onCrosshairMove) return;
      const timeScale = chartRef.current.timeScale();
      const currentTime = timeScale.coordinateToTime(x) as number;
      
      if (currentTime) {
          const currentPoint = (data as any[]).find(d => d.time === currentTime) || 
                               (data as any[]).reduce((prev, curr) => Math.abs(curr.time - currentTime) < Math.abs(prev.time - currentTime) ? curr : prev);
          
          if (currentPoint) {
              const currentVol = volumeData.find(v => v.time === currentPoint.time)?.value || 0;
              onCrosshairMove({
                  price: currentPoint.value,
                  volume: currentVol,
                  timestamp: currentPoint.time * 1000
              });

              // Calculate coordinates for dot
              const px = timeScale.timeToCoordinate(currentPoint.time);
              const py = areaSeriesRef.current.priceToCoordinate(currentPoint.value);
              if (px !== null && py !== null) {
                  setCrosshairPoint({ x: px, y: py });
              } else {
                  setCrosshairPoint(null);
              }
          }
      }
  };

  const processDragStart = (clientX: number) => {
      if (!chartContainerRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      dragStartRef.current = { x, y: 0 };
      setSelectionBox(null); 
      updateCrosshairData(x);
  };

  const [selectionStats, setSelectionStats] = React.useState<{ change: number; percent: number; startTime: number; endTime: number } | null>(null);
  const [selectionPath, setSelectionPath] = React.useState<string>('');

  const processDragMove = (clientX: number) => {
      if (!dragStartRef.current || !chartContainerRef.current || !chartRef.current || !areaSeriesRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      
      const startX = Math.min(x, dragStartRef.current.x);
      let width = Math.abs(x - dragStartRef.current.x);

      const timeScaleHeight = chartRef.current.timeScale().height();
      const priceScaleWidth = chartRef.current.priceScale('right').width();
      const plotHeight = rect.height - timeScaleHeight;
      const plotWidth = rect.width - priceScaleWidth;

      if (startX + width > plotWidth) {
          width = Math.max(0, plotWidth - startX);
      }
      
      setSelectionBox({ x: startX, y: 0, w: width, h: plotHeight });

      if (chartRef.current && data.length > 0) {
          const timeScale = chartRef.current.timeScale();
          const t1 = timeScale.coordinateToTime(startX) as number;
          const t2 = timeScale.coordinateToTime(startX + width) as number;
          
          updateCrosshairData(x); // Header update during move

          if (t1 && t2) {
              const sortedData = data as any[];
              const visiblePoints = sortedData.filter(d => d.time >= t1 && d.time <= t2);

              // Generate SVG Path for Under-Graph Highlight
              if (visiblePoints.length > 0) {
                   let pathd = `M ${timeScale.timeToCoordinate(visiblePoints[0].time) ?? startX} ${plotHeight}`;
                   visiblePoints.forEach(p => {
                       const px = timeScale.timeToCoordinate(p.time);
                       const py = areaSeriesRef.current!.priceToCoordinate(p.value);
                       if (px !== null && py !== null) {
                           pathd += ` L ${px} ${py}`;
                       }
                   });
                   pathd += ` L ${timeScale.timeToCoordinate(visiblePoints[visiblePoints.length-1].time) ?? (startX + width)} ${plotHeight} Z`;
                   setSelectionPath(pathd);
              } else {
                  setSelectionPath('');
              }

              const p1 = sortedData.find(d => d.time === t1) || sortedData.reduce((prev, curr) => Math.abs(curr.time - t1) < Math.abs(prev.time - t1) ? curr : prev);
              const p2 = sortedData.find(d => d.time === t2) || sortedData.reduce((prev, curr) => Math.abs(curr.time - t2) < Math.abs(prev.time - t2) ? curr : prev);

              if (p1 && p2) {
                  const change = p2.value - p1.value;
                  const percent = (change / p1.value) * 100;
                  setSelectionStats({ change, percent, startTime: t1, endTime: t2 });
              }
          }
      }
  };

  const processDragEnd = () => {
      dragStartRef.current = null;
      setCrosshairPoint(null);
      if (onCrosshairMove) onCrosshairMove(null);
  };

    // Determine dynamic color based on selection performance
    const selectionColor = selectionStats 
        ? (selectionStats.change >= 0 ? '#22c55e' : '#ef4444') 
        : chartColor;

    return (
    <div 
        ref={chartContainerRef} 
        className="w-full h-full relative select-none cursor-crosshair"
        onMouseDownCapture={(e) => processDragStart(e.clientX)}
        onMouseMoveCapture={(e) => processDragMove(e.clientX)}
        onMouseUpCapture={processDragEnd}
        onMouseLeave={processDragEnd}
        onTouchStartCapture={(e) => processDragStart(e.touches[0].clientX)}
        onTouchMoveCapture={(e) => processDragMove(e.touches[0].clientX)}
        onTouchEndCapture={processDragEnd}
    >
        {selectionBox && (
            <>
                {/* Under-Graph Highlight (SVG) */}
        {/* Mobile Crosshair Dot */}
        {crosshairPoint && dragStartRef.current && (
             <div 
                className="absolute w-3 h-3 rounded-full bg-white border-2 z-30 pointer-events-none shadow-sm"
                style={{ 
                    left: crosshairPoint.x - 6, 
                    top: crosshairPoint.y - 6,
                    borderColor: chartColor,
                }}
             />
        )}
                <svg 
                    className="absolute top-0 left-0 z-10 pointer-events-none"
                    style={{ width: '100%', height: selectionBox.h }}
                >
                    <path 
                        d={selectionPath} 
                        fill={selectionColor} 
                        fillOpacity={0.2}
                        stroke={selectionColor}
                        strokeWidth={1}
                    />
                </svg>

                {selectionStats && (
                    <div 
                        className="absolute z-20 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap pointer-events-none"
                        style={{ 
                            left: Math.max(0, Math.min(selectionBox.x + (selectionBox.w / 2) - 60, (chartContainerRef.current?.clientWidth || 0) - 120)), // Clamp
                            top: 20 
                        }}
                    >
                        <div className={`font-bold ${selectionStats.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.abs(selectionStats.change).toFixed(2)} ({Math.abs(selectionStats.percent).toFixed(2)}%)
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                           {(() => {
                               const diff = selectionStats.endTime - selectionStats.startTime;
                               if (diff < 86400) {
                                   return `${new Date(selectionStats.startTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(selectionStats.endTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                               } else {
                                    const days = Math.round(diff / 86400);
                                    if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
                                    const months = Math.floor(days / 30); 
                                    if (months < 12) return `${months} mo ${days % 30 > 0 ? `${days % 30} d` : ''}`;
                                    const years = Math.floor(months / 12);
                                    return `${years} yr ${months % 12 > 0 ? `${months % 12} mo` : ''}`;
                               }
                           })()}
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';

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
  onCrosshairMove?: (data: { price: number; volume: number; timestamp: number } | null) => void;
}

export interface TradingViewChartHandle {
    resetChart: () => void;
}

export const TradingViewChart = forwardRef<TradingViewChartHandle, TradingViewChartProps>(({
  data,
  volumeData,
  chartColor,
  showVolume,
  referencePrice,
  visibleRange,
  onCrosshairMove,
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const priceLineRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
      resetChart: () => {
          if (chartRef.current) {
              chartRef.current.timeScale().fitContent();
          }
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
        vertLines: { color: 'rgba(42, 46, 57, 0)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)', style: LineStyle.Dotted },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        rightOffset: 0,
      },
      rightPriceScale: {
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
      handleScale: {
          mouseWheel: true,
          pinch: true,
      },
      handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          vertTouchDrag: false,
          horzTouchDrag: true,
      }
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: chartColor,
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineColor: chartColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lastValueVisible: true,
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
                if (isIntraday) {
                    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
                }
                return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
            },
        }
    });
  }, [visibleRange]);

  useEffect(() => {
    if (chartRef.current) {
        chartRef.current.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: showVolume ? 0.2 : 0.1,
            }
        });
    }
  }, [showVolume]);
  
  useEffect(() => {
    if (areaSeriesRef.current && data) {
         areaSeriesRef.current.setData(data as any); 
         if (chartRef.current && data.length > 0) {
             chartRef.current.timeScale().fitContent();
         }
    }
  }, [data]);

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

  return (
    <div ref={chartContainerRef} className="w-full h-full relative" />
  );
});

TradingViewChart.displayName = 'TradingViewChart';

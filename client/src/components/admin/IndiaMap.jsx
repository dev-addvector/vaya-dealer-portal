import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5geodata_indiaLow from '@amcharts/amcharts5-geodata/indiaLow';

function normalize(s) {
  return (s ?? '').toLowerCase().replace(/\s+/g, '');
}

export function IndiaMap({ locationMap }) {
  const chartDivRef = useRef(null);

  useEffect(() => {
    const root = am5.Root.new(chartDivRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'rotateX',
        projection: am5map.geoMercator(),
        layout: root.horizontalLayout,
      })
    );

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_indiaLow,
        calculateAggregates: true,
        valueField: 'value',
      })
    );

    const countByKey = {};
    locationMap.forEach((r) => {
      countByKey[normalize(r.location)] = r.count;
    });

    function getCount(name) {
      const key = normalize(name);
      if (countByKey[key] !== undefined) return countByKey[key];
      const found = Object.entries(countByKey).find(
        ([k]) => k.includes(key) || key.includes(k)
      );
      return found ? found[1] : 0;
    }

    const data = am5geodata_indiaLow.features.map((feature) => ({
      id: feature.id,
      value: getCount(feature.properties.name),
    }));
    polygonSeries.data.setAll(data);

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: '{name} - {value}',
      toggleKey: 'active',
      interactive: true,
    });

    polygonSeries.mapPolygons.template.states.create('hover', {
      fill: am5.color(0x677935),
    });

    polygonSeries.set('heatRules', [
      {
        target: polygonSeries.mapPolygons.template,
        dataField: 'value',
        min: am5.color('#c3cfc8'),
        max: am5.color('#4e06e7'),
        key: 'fill',
      },
    ]);

    const heatLegend = chart.children.push(
      am5.HeatLegend.new(root, {
        orientation: 'horizontal',
        startColor: am5.color('#c3cfc8'),
        endColor: am5.color('#4e06e7'),
        startText: 'Lowest',
        endText: 'Highest',
        stepCount: 1,
      })
    );

    heatLegend.startLabel.setAll({ fontSize: 12, fill: heatLegend.get('startColor') });
    heatLegend.endLabel.setAll({ fontSize: 12, fill: heatLegend.get('endColor') });

    polygonSeries.mapPolygons.template.events.on('pointerover', (ev) => {
      heatLegend.showValue(ev.target.dataItem.get('value'));
    });

    polygonSeries.events.on('datavalidated', () => {
      heatLegend.set('startValue', polygonSeries.getPrivate('valueLow'));
      heatLegend.set('endValue', polygonSeries.getPrivate('valueHigh'));
    });

    return () => {
      root.dispose();
    };
  }, [locationMap]);

  return <div ref={chartDivRef} className="w-full h-[320px]" />;
}

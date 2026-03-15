import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function BarChart(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
    </Svg>
  );
}

export default BarChart;

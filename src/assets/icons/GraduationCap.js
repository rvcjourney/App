import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const GraduationCap = ({ width = 32, height = 32, fill = '#5568FE' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7.5V8C2 8 2 15 12 19C22 15 22 8 22 8V7.5L12 2Z"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19V22"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M8 21H16"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export default GraduationCap;

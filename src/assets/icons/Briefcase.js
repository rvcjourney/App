import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const Briefcase = ({ width = 32, height = 32, fill = '#5568FE' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="7"
      width="20"
      height="13"
      rx="1"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
    />
    <Path
      d="M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M9 12H15"
      stroke={fill}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export default Briefcase;

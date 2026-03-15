import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function TrendingUp(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M16 6l2.29 2.29-4.29 4.29-4-4L2 16.59 3.41 18 9 12.41l4 4 6.29-6.29L22 12V6z" />
    </Svg>
  );
}

export default TrendingUp;

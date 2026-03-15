import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Lightbulb(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-6c2.76 0 5-2.24 5-5 0-2.56-2.11-4.82-4.63-4.99.35-.6.63-1.29.63-1.99 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 .7.28 1.39.63 1.99C5.11 4.18 3 6.44 3 9c0 2.76 2.24 5 5 5zm0 2c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

export default Lightbulb;

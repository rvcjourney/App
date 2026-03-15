import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Hourglass(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M6 2c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4 2.21 0 4-1.79 4-4V4c0-1.1-.9-2-2-2H6zm0 2h3v3c0 1.1-.9 2-2 2s-2-.9-2-2V4zm9 15H6v-1h9v1zm0-2H6v-1h9v1zm5-6v-3c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4 2.21 0 4-1.79 4-4zm-5 0c-1.1 0-2-.9-2-2v-3h3v3c0 1.1-.9 2-2 2z" />
    </Svg>
  );
}

export default Hourglass;

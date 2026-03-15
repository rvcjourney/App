import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Minus(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M19 13H5v-2h14v2z" />
    </Svg>
  );
}

export default Minus;

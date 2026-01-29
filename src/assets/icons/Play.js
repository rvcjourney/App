import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Play(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

export default Play;

import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function ChevronLeft(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </Svg>
  );
}

export default ChevronLeft;

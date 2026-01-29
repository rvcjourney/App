import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function BookOpen(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M5 2c-1.104 0-2 .896-2 2v14c0 1.104.896 2 2 2h14c1.104 0 2-.896 2-2V4c0-1.104-.896-2-2-2H5zm0 2h7v12H5V4zm9 0h5v12h-5V4z" />
    </Svg>
  );
}

export default BookOpen;

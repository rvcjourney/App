import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Clock(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M11.99 5C9.24 5 7 7.24 7 9.99h2c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1-1 2-2 3v3h2c0-1-1-2-2-3 2-1 3-2.24 3-4 0-2.75-2.24-5-5-5zm.9 9H11V9h1.9v5z" />
    </Svg>
  );
}

export default Clock;

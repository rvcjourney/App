import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Phone(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M17.707 12.293l-5.293-5.293a1 1 0 00-1.414 0l-5.293 5.293a1 1 0 001.414 1.414L11 9.414V19a1 1 0 102 0V9.414l3.879 3.879a1 1 0 001.414-1.414z" />
    </Svg>
  );
}

export default Phone;

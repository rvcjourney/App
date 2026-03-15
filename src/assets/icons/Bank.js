import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Bank(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M12 2L2 7v2h20V7L12 2zm0 5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 9H4v2h16v-2z" />
    </Svg>
  );
}

export default Bank;

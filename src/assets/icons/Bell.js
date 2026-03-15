import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Bell(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V2c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 3.36 6 5.93 6 9v5l-2 2v1h16v-1l-2-2z" />
    </Svg>
  );
}

export default Bell;

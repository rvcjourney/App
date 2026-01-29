import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

function Calendar(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
      <Path d="M7 10h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z" />
    </Svg>
  );
}

export default Calendar;

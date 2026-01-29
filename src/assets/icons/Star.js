import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Star(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21 12 17.27z" />
    </Svg>
  );
}

export default Star;

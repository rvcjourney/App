import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function DollarSign(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1m0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9m3.5-9c0 .83-.67 1.5-1.5 1.5h-2v2h-2v-2h-2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h4v-2h-4c-1.93 0-3.5 1.57-3.5 3.5S6.57 15 8.5 15h2v2h2v-2h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-4v2h4c1.93 0 3.5-1.57 3.5-3.5S15.43 13 13.5 13h-2v-2h2c.83 0 1.5-.67 1.5-1.5" />
    </Svg>
  );
}

export default DollarSign;

import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

function CreditCard(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M2 8h20" />
    </Svg>
  );
}

export default CreditCard;

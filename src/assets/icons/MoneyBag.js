import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function MoneyBag(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M12 2c-.6 0-1 .4-1 1 0 .4.2.7.5.9L9 6h6l-2.5-2.1c.3-.2.5-.5.5-.9 0-.6-.4-1-1-1z" />
      <Path d="M8 7c-2.2 1.8-4 4.7-4 8 0 4.4 3.6 7 8 7s8-2.6 8-7c0-3.3-1.8-6.2-4-8H8z" />
      <Path d="M9 13h6v2H9z" />
    </Svg>
  );
}

export default MoneyBag;

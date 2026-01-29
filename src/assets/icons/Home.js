import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Home(props) {
  return (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </Svg>
  );
}

export default Home;

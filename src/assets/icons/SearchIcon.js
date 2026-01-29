import * as React from "react";
import Svg, { Path } from "react-native-svg";

function SearchIcon(props) {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        d="M21 20l-5.2-5.2a7.5 7.5 0 10-1.4 1.4L20 21a1 1 0 001-1zM10.5 16a5.5 5.5 0 115.5-5.5 5.507 5.507 0 01-5.5 5.5z"
        fill={props.fill}
      />
    </Svg>
  );
}

export default SearchIcon;

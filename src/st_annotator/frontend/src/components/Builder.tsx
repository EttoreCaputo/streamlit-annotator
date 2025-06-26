import React from "react";
import Annotator from "./Annotator";

const Builder: React.FC<{mode: string}> = ({ mode }) => {

    if (mode === "text_annotator") {
        return <Annotator />;
    } else {
        return null;
    }
}

export default Builder;

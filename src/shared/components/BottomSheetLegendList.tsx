import { useBottomSheetScrollableCreator } from "@gorhom/bottom-sheet";
import { LegendList, LegendListProps } from "@legendapp/list/react-native";
import React, { forwardRef } from "react";

export const BottomSheetLegendList = forwardRef<any, LegendListProps<any>>(
  (props, ref) => {
    const renderScrollComponent = useBottomSheetScrollableCreator();

    return (
      <LegendList
        {...props}
        ref={ref}
        renderScrollComponent={renderScrollComponent as any}
      />
    );
  }
);

BottomSheetLegendList.displayName = "BottomSheetLegendList";

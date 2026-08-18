import { View } from "react-native";
import { ToastConfig } from "react-native-toast-message";
import { BaseText } from "./BaseText";

export const toastConfig: ToastConfig = {
  success: (props) => (
    <View className="w-[90%] bg-surface dark:bg-surface-dark rounded-xl px-4 py-3 shadow-sm border-l-4 border-primary flex-row items-center">
      <View className="flex-1">
        <BaseText
          type="body-md"
          className="font-bold text-label dark:text-label-dark"
        >
          {props.text1}
        </BaseText>
        {props.text2 && (
          <BaseText
            type="body-sm"
            className="text-neutral-500 dark:text-neutral-300 mt-1"
          >
            {props.text2}
          </BaseText>
        )}
      </View>
    </View>
  ),
  error: (props) => (
    <View className="w-[90%] bg-surface dark:bg-surface-dark rounded-xl px-4 py-3 shadow-sm border-l-4 border-red-500 flex-row items-center">
      <View className="flex-1">
        <BaseText
          type="body-md"
          className="font-bold text-label dark:text-label-dark"
        >
          {props.text1}
        </BaseText>
        {props.text2 && (
          <BaseText
            type="body-sm"
            className="text-neutral-500 dark:text-neutral-300 mt-1"
          >
            {props.text2}
          </BaseText>
        )}
      </View>
    </View>
  ),
  info: (props) => (
    <View className="w-[90%] bg-surface dark:bg-surface-dark rounded-xl px-4 py-3 shadow-sm border-l-4 border-blue-500 flex-row items-center">
      <View className="flex-1">
        <BaseText
          type="body-md"
          className="font-bold text-label dark:text-label-dark"
        >
          {props.text1}
        </BaseText>
        {props.text2 && (
          <BaseText
            type="body-sm"
            className="text-neutral-500 dark:text-neutral-300 mt-1"
          >
            {props.text2}
          </BaseText>
        )}
      </View>
    </View>
  ),
};

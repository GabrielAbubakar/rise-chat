import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ToastConfig } from "react-native-toast-message";
import { BaseText } from "./BaseText";

export const toastConfig: ToastConfig = {
  success: (props) => (
    <View className="w-[90%] bg-surface dark:bg-surface-dark rounded-xl px-4 py-3 shadow-sm border-l-4 border-green-500 flex-row items-center">
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
    <View className="bg-surface dark:bg-surface-dark border border-neutral-200 dark:border-neutral-700/80 rounded-full px-5 py-3 shadow-md flex-row items-center justify-center max-w-[90%] self-center">
      <Ionicons
        name="information-circle-outline"
        size={20}
        color="#3B82F6"
        style={{ marginRight: 8 }}
      />
      <View className="flex-row items-center flex-shrink">
        <BaseText
          type="body-md"
          className="font-medium text-label dark:text-label-dark"
        >
          {props.text1}
        </BaseText>
        {props.text2 && (
          <BaseText
            type="body-sm"
            className="text-neutral-500 dark:text-neutral-300 ml-2"
          >
            {props.text2}
          </BaseText>
        )}
      </View>
    </View>
  ),
};

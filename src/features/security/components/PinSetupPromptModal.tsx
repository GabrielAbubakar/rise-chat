import LockIcon from "@/assets/icons/solid/lock-closed.svg";
import { BaseButton, BaseText } from "@/shared/components";
import { colors } from "@/shared/constants/tokens";
import React from "react";
import { Modal, View } from "react-native";

interface PinSetupPromptModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PinSetupPromptModal: React.FC<PinSetupPromptModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onDecline}
    >
      {/* <BlurView intensity={20} tint="dark" className="flex-1 justify-center items-center p-6"> */}
      <View className="flex-1 justify-center items-center p-6">
        <View className="w-full max-w-[400px] rounded-[20px] p-6 items-center bg-surface dark:bg-surface-dark shadow-md shadow-black/25 elevation-5">
          <View
            style={{
              // elevation: 1,
              boxShadow: "0px 2px 4px rgba(0, 0, 30, 0.3)",
            }}
            className="w-[60px] h-[60px] rounded-2xl justify-center items-center mb-5 -mt-16 bg-white dark:bg-neutral-700"
          >
            <LockIcon width={24} height={24} color={colors.primary.DEFAULT} />
          </View>

          <BaseText type="h4" className="mb-3" align="center">
            Do you want to add a pin code?
          </BaseText>
          <BaseText
            type="body-md"
            color="secondary"
            align="center"
            className="mb-8"
          >
            Add a verification code to make it more secure.
          </BaseText>

          <BaseButton title="Yes" className="mb-3" onPress={onAccept} />

          <BaseButton
            title="No, thanks"
            variant="secondary"
            onPress={onDecline}
          />
        </View>
      </View>
    </Modal>
  );
};

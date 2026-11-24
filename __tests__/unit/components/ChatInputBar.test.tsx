/**
 * R2 — smoke-render the real composer (with its SVG icon imports) under the
 * committed Jest config, with no per-test SVG mocks.
 */
import { ChatInputBar } from "@/features/chats/components/ChatInputBar";
import { fireEvent, render, screen } from "@testing-library/react-native";

const baseProps = {
  message: "",
  onChangeText: jest.fn(),
  onSend: jest.fn(),
  isPending: false,
  insetsBottom: 0,
  isDark: false,
  onToggleAttachmentMenu: jest.fn(),
};

describe("ChatInputBar (production component)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the input, attach and send controls with their icons", async () => {
    await render(<ChatInputBar {...baseProps} />);

    expect(screen.getByLabelText("Message input")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach media or file" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    expect(screen.getAllByTestId("svg-icon")).toHaveLength(2);
  });

  it("forwards typing, send and attach presses", async () => {
    await render(<ChatInputBar {...baseProps} />);

    await fireEvent.changeText(screen.getByLabelText("Message input"), "hello");
    await fireEvent.press(screen.getByRole("button", { name: "Send message" }));
    await fireEvent.press(screen.getByRole("button", { name: "Attach media or file" }));

    expect(baseProps.onChangeText).toHaveBeenCalledWith("hello");
    expect(baseProps.onSend).toHaveBeenCalledTimes(1);
    expect(baseProps.onToggleAttachmentMenu).toHaveBeenCalledTimes(1);
  });

  it("disables send and shows a spinner while pending", async () => {
    await render(<ChatInputBar {...baseProps} isPending />);

    // RTL 14 treats accessibilityState.busy as hidden by default
    const send = screen.getByLabelText("Send message", { includeHiddenElements: true });
    expect(send).toBeDisabled();
    expect(send).toBeBusy();
    // Only the paper-clip icon remains; the plane is replaced by the spinner
    expect(screen.getAllByTestId("svg-icon")).toHaveLength(1);
  });
});

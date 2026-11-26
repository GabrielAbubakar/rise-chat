import { BaseText } from "@/shared/components/BaseText";
import { render, screen } from "@testing-library/react-native";

describe("BaseText component", () => {
  it("renders children correctly", async () => {
    await render(<BaseText>Hello Testing</BaseText>);
    expect(screen.getByText("Hello Testing")).toBeTruthy();
  });

  it("renders with testID", async () => {
    await render(<BaseText testID="custom-text">Custom Text</BaseText>);
    expect(screen.getByTestId("custom-text")).toBeTruthy();
  });
});

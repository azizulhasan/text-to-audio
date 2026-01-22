import { Form } from "react-bootstrap";
import { __ } from "@wordpress/i18n";

export default function TTSButtonDesign({
  handleChange,
  customCSS,
  listeningBtnStyle,
}) {
  return (
    <>
      {/* Color Controls Section */}
      <div className="tta_colors_row">
        <div className="tta_color_item">
          <div className="tta_color_label">{__("Background Color")}</div>
          <div className="tta_color_input_wrapper">
            <div className="tta_color_picker_icon">
              <Form.Control
                type="color"
                name="backgroundColor"
                onChange={handleChange}
                id="backgroundColor"
                value={listeningBtnStyle.backgroundColor}
                title="Choose player background color"
              />
            </div>
            <div
              className="tta_color_display"
              style={{ backgroundColor: listeningBtnStyle.backgroundColor }}
            />
          </div>
        </div>

        <div className="tta_color_item">
          <div className="tta_color_label">{__("Text Color", "text-to-audio")}</div>
          <div className="tta_color_input_wrapper">
            <div className="tta_color_picker_icon">
              <Form.Control
                type="color"
                name="color"
                onChange={handleChange}
                id="color"
                value={listeningBtnStyle.color}
                title="Choose your color"
              />
            </div>
            <div
              className="tta_color_display"
              style={{ backgroundColor: listeningBtnStyle.color }}
            />
          </div>
        </div>

        <div className="tta_color_item">
          <div className="tta_color_label">{__("Hover BG Color", "text-to-audio")}</div>
          <div className="tta_color_input_wrapper">
            <div className="tta_color_picker_icon">
              <Form.Control
                type="color"
                name="hoverBackgroundColor"
                onChange={handleChange}
                id="hoverBackgroundColor"
                value={listeningBtnStyle.hoverBackgroundColor}
                title="Choose your hover background color"
              />
            </div>
            <div
              className="tta_color_display"
              style={{
                backgroundColor: listeningBtnStyle.hoverBackgroundColor,
              }}
            />
          </div>
        </div>

        <div className="tta_color_item">
          <div className="tta_color_label">{__("Hover Text Color", "text-to-audio")}</div>
          <div className="tta_color_input_wrapper">
            <div className="tta_color_picker_icon">
              <Form.Control
                type="color"
                name="hoverTextColor"
                onChange={handleChange}
                id="hoverTextColor"
                value={listeningBtnStyle.hoverTextColor}
                title="Choose your hover text color"
              />
            </div>
            <div
              className="tta_color_display"
              style={{ backgroundColor: listeningBtnStyle.hoverTextColor }}
            />
          </div>
        </div>
      </div>

      {/* Margin Size Section */}
      <div className="tta_section_title">{__("Margin Size (Px)", "text-to-audio")}</div>
      <div className="tta_input_row">
        <div className="tta_input_group">
          <div className="tta_input_label">
            Top {listeningBtnStyle.marginTop || 0}
          </div>
          <Form.Control
            type="number"
            name="marginTop"
            onChange={handleChange}
            id="marginTop"
            value={listeningBtnStyle.marginTop}
            title="Margin Top"
            className="tta_number_input"
          />
        </div>

        <div className="tta_input_group">
          <div className="tta_input_label">
            Bottom {listeningBtnStyle.marginBottom || 0}
          </div>
          <Form.Control
            type="number"
            name="marginBottom"
            onChange={handleChange}
            id="marginBottom"
            value={listeningBtnStyle.marginBottom}
            title="Margin Bottom"
            className="tta_number_input"
          />
        </div>

        <div className="tta_input_group">
          <div className="tta_input_label">
            Left {listeningBtnStyle.marginLeft || 0}
          </div>
          <Form.Control
            type="number"
            name="marginLeft"
            onChange={handleChange}
            id="marginLeft"
            value={listeningBtnStyle.marginLeft}
            title="Margin Left"
            className="tta_number_input"
          />
        </div>

        <div className="tta_input_group">
          <div className="tta_input_label">
            Right {listeningBtnStyle.marginRight || 0}
          </div>
          <Form.Control
            type="number"
            name="marginRight"
            onChange={handleChange}
            id="marginRight"
            value={listeningBtnStyle.marginRight}
            title="Margin Right"
            className="tta_number_input"
          />
        </div>
      </div>

      {/* Button Properties Section */}
      <div className="tta_section_title">{__("Button Properties", "text-to-audio")}</div>
      <div className="tta_input_row">
        <div className="tta_input_group">
          <div className="tta_input_label">
            Width {listeningBtnStyle.width || 100}%
          </div>
          <Form.Control
            type="number"
            name="width"
            onChange={handleChange}
            id="width"
            min="0"
            max="100"
            value={listeningBtnStyle.width}
            title="Button Width"
            className="tta_number_input"
          />
        </div>

        {listeningBtnStyle?.buttonSettings?.id === 1 && (
          <>
            <div className="tta_input_group">
              <div className="tta_input_label">
                Height {listeningBtnStyle.height || 50}%
              </div>
              <Form.Control
                type="number"
                name="height"
                onChange={handleChange}
                id="height"
                min="0"
                max="200"
                value={listeningBtnStyle.height}
                title="Button height"
                className="tta_number_input"
              />
            </div>

            <div className="tta_input_group">
              <div className="tta_input_label">
                Border {listeningBtnStyle.border || 2} px
              </div>
              <Form.Control
                type="number"
                name="border"
                onChange={handleChange}
                id="border"
                min="0"
                max="20"
                value={listeningBtnStyle.border}
                title="Button border"
                className="tta_number_input"
              />
            </div>

            <div className="tta_input_group">
              <div className="tta_input_label">
                Radius {listeningBtnStyle.borderRadius || 2} px
              </div>
              <Form.Control
                type="number"
                name="borderRadius"
                onChange={handleChange}
                id="borderRadius"
                min="0"
                max="200"
                value={listeningBtnStyle.borderRadius}
                title="Button border radius"
                className="tta_number_input"
              />
            </div>
          </>
        )}
      </div>

      {listeningBtnStyle?.buttonSettings?.id === 1 && (
        <>
          {/* Border Color Section */}
          <div className="tta_section_title">{__("Border Color", "text-to-audio")}</div>
          <div className="tta_color_palette">
            <div className="tta_color_palette_item">
              <Form.Control
                type="color"
                name="border_color"
                onChange={handleChange}
                id="border_color"
                value={listeningBtnStyle.border_color}
                title="Border Color"
              />
            </div>

            {/* Preset color swatches */}
            {[
              "#E91E63",
              "#26C6DA",
              "#CDDC39",
              "#FFEB3B",
              "#FFAB91",
              "#EF9A9A",
              "#FF8A80",
              "#FF6E63",
              "#FF5252",
              "#E57373",
              "#EF5350",
            ].map((color) => (
              <div
                key={color}
                className="tta_color_display tta_color_swatch_clickable"
                style={{
                  backgroundColor: color,
                  width: "40px",
                  height: "40px",
                }}
                onClick={() =>
                  handleChange({
                    target: { name: "border_color", value: color },
                  })
                }
              />
            ))}
          </div>

          {/* Font Size (hidden in this view but keeping functionality) */}
          <div style={{ display: "none" }}>
            <Form.Control
              type="number"
              name="fontSize"
              onChange={handleChange}
              id="fontSize"
              min="0"
              max="100"
              value={listeningBtnStyle.fontSize}
              title="Font size"
            />
          </div>
        </>
      )}

      {/* Custom CSS Section */}
      <div className="tta_section_title">{__("Custom CSS", "text-to-audio")}</div>
      <Form.Control
        as="textarea"
        name="custom_css"
        id="custom_css"
        className="tta_custom_css_textarea"
        onChange={handleChange}
        value={customCSS ? customCSS : ""}
        placeholder="Enter Custom CSS here"
      />
    </>
    
  );
}

import {Form} from "react-bootstrap";
import {__} from "@wordpress/i18n";

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
                    <div className="tta_color_label">{__('Background Color', 'text-to-audio')}</div>
                    <div className="tta_color_input_wrapper">
                        <div className="tta_color_picker_icon">
                            <Form.Control
                                type="color"
                                name="backgroundColor"
                                onChange={handleChange}
                                id="backgroundColor"
                                value={listeningBtnStyle.backgroundColor}
                                title={__("Choose player background color", "text-to-audio")}
                            />
                        </div>
                        <div
                            className="tta_color_display"
                            style={{backgroundColor: listeningBtnStyle.backgroundColor}}
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
                                title={__("Choose your color", "text-to-audio")}
                            />
                        </div>
                        <div
                            className="tta_color_display"
                            style={{backgroundColor: listeningBtnStyle.color}}
                        />
                    </div>
                </div>

                <div className="tta_color_item">
                    <div className="tta_color_label">{__('Hover BG Color', 'text-to-audio')}</div>
                    <div className="tta_color_input_wrapper">
                        <div className="tta_color_picker_icon">
                            <Form.Control
                                type="color"
                                name="hoverBackgroundColor"
                                onChange={handleChange}
                                id="hoverBackgroundColor"
                                value={listeningBtnStyle.hoverBackgroundColor}
                                title={__("Choose your hover background color", "text-to-audio")}
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
                                title={__("Choose your hover text color", "text-to-audio")}
                            />
                        </div>
                        <div
                            className="tta_color_display"
                            style={{backgroundColor: listeningBtnStyle.hoverTextColor}}
                        />
                    </div>
                </div>
            </div>

            {/* Margin Size Section */}
            <div className="tta_section_title">{__("Margin Size (Px)", "text-to-audio")}</div>
            <div className="tta_input_row">
                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Top', 'text-to-audio')} {listeningBtnStyle.marginTop || 0}</div>
                    <Form.Control
                        type="number"
                        name="marginTop"
                        onChange={handleChange}
                        id="marginTop"
                        value={listeningBtnStyle.marginTop}
                        title={__("Margin Top", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Bottom', 'text-to-audio')} {listeningBtnStyle.marginBottom || 0}</div>
                    <Form.Control
                        type="number"
                        name="marginBottom"
                        onChange={handleChange}
                        id="marginBottom"
                        value={listeningBtnStyle.marginBottom}
                        title={__("Margin Bottom", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Left', 'text-to-audio')} {listeningBtnStyle.marginLeft || 0}</div>
                    <Form.Control
                        type="number"
                        name="marginLeft"
                        onChange={handleChange}
                        id="marginLeft"
                        value={listeningBtnStyle.marginLeft}
                        title={__("Margin Left", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Right', 'text-to-audio')} {listeningBtnStyle.marginRight || 0}</div>
                    <Form.Control
                        type="number"
                        name="marginRight"
                        onChange={handleChange}
                        id="marginRight"
                        value={listeningBtnStyle.marginRight}
                        title={__("Margin Right", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>
            </div>
            {/* Button Style Section - NEW SECTION WITH ALL MISSING FEATURES */}
            <div className="tta_section_title">{__('Button Style', 'text-to-audio')}</div>
            <div className="tta_input_row">
                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Height', 'text-to-audio')} {listeningBtnStyle.height || 50}</div>
                    <Form.Control
                        type="number"
                        name="height"
                        onChange={handleChange}
                        id="height"
                        min="0"
                        max="200"
                        value={listeningBtnStyle.height}
                        title={__("Button Height", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Border', 'text-to-audio')} {listeningBtnStyle.border || 2} px
                    </div>
                    <Form.Control
                        type="number"
                        name="border"
                        onChange={handleChange}
                        id="border"
                        min="0"
                        max="20"
                        value={listeningBtnStyle.border}
                        title={__("Button Border", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div className="tta_input_label">{__('Border Color', 'text-to-audio')}</div>
                    <div className="tta_color_input_wrapper">
                        <div className="tta_color_picker_icon">
                            <Form.Control
                                type="color"
                                name="border_color"
                                onChange={handleChange}
                                id="border_color"
                                value={listeningBtnStyle.border_color}
                                title={__("Border Color", "text-to-audio")}
                            />
                        </div>
                        <div
                            className="tta_color_display"
                            style={{backgroundColor: listeningBtnStyle.border_color}}
                        />
                    </div>
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Font Size', 'text-to-audio')} {listeningBtnStyle.fontSize || 20} px
                    </div>
                    <Form.Control
                        type="number"
                        name="fontSize"
                        onChange={handleChange}
                        id="fontSize"
                        min="0"
                        max="100"
                        value={listeningBtnStyle.fontSize}
                        title={__("Font Size", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                <div className="tta_input_group">
                    <div
                        className="tta_input_label">{__('Radius', 'text-to-audio')} {listeningBtnStyle.borderRadius || 10} px
                    </div>
                    <Form.Control
                        type="number"
                        name="borderRadius"
                        onChange={handleChange}
                        id="borderRadius"
                        min="0"
                        max="200"
                        value={listeningBtnStyle.borderRadius}
                        title={__("Border Radius", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>
            </div>

            {/* Button Properties Section */}
            <div className="tta_section_title">{__('Button Properties', 'text-to-audio')}</div>
            <div className="tta_input_row">
                <div className="tta_input_group">
                    <div className="tta_input_label">{__('Width', 'text-to-audio')} {listeningBtnStyle.width || 100}%
                    </div>
                    <Form.Control
                        type="number"
                        name="width"
                        onChange={handleChange}
                        id="width"
                        min="0"
                        max="100"
                        value={listeningBtnStyle.width}
                        title={__("Button Width", "text-to-audio")}
                        className="tta_number_input"
                    />
                </div>

                {/* {listeningBtnStyle?.buttonSettings?.id === 1 && (
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
        )} */}
            </div>

            {/* Custom CSS Section */}
            <div className="tta_section_title">{__("Custom CSS", "text-to-audio")}</div>
            <Form.Control
                as="textarea"
                name="custom_css"
                id="custom_css"
                className="tta_custom_css_textarea"
                onChange={handleChange}
                value={customCSS ? customCSS : ""}
                placeholder={__('Enter Custom CSS here', 'text-to-audio')}
            />
        </>

    );
}
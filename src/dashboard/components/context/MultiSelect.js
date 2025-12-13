import "./multiselect.css";
import toast from "./Notify";
import { isObject } from "./utilities";

class MultiSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItems: props.selectedItems || [],
      expanded: true,
      inputValue: props.options,
      isFocused: false,
      id: props.id,
      name: props.name,
      onChange: props.onChange,
      multiselectIndex: props.multiselectIndex || 0,
      toastMessage:
        props.toastMessage ||
        "Showing button to multiple post is not supported in free version.",
      selectionLimit: props.selectionLimit || 1,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.renderDropdown = this.renderDropdown.bind(this);
    this.hydrateInput = this.hydrateInput.bind(this);
    this.checkStatus = this.checkStatus.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleWrapperClick = this.handleWrapperClick.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.wrapperRef = React.createRef();
    this.dropdownRef = React.createRef();

    // Store scroll position
    this.scrollPosition = 0;
  }

  handleChange = (event) => {
    // Save scroll position before any state changes
    this.scrollPosition = window.scrollY;

    if (event && event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    // IMPORTANT: Prevent focus on the input element
    event.target.blur();

    let selectedItems = [...(this.state?.selectedItems || [])];
    let selectionLimit = this.state?.selectionLimit || 1;
    const value = event.target.value;

    if (
      window.hasOwnProperty("ttsObjPro") &&
      !ttsObjPro.is_pro_active &&
      selectedItems.length > selectionLimit
    ) {
      toast(
        <h6>
          {this.state.toastMessage} Please{" "}
          <a
            target="_blank"
            href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
          >
            buy pro version
          </a>
        </h6>,
        "info",
        { autoClose: 10000 }
      );
      selectedItems = [];
      selectedItems.push(value);
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          // Restore scroll position after state update
          window.scrollTo(0, this.scrollPosition);
        }
      );

      if (this.props.onChange && typeof this.props.onChange === "function") {
        this.props.onChange(selectedItems, this.state.name);
      }
      return;
    }

    if (selectedItems.length === 0) {
      selectedItems.push(value);
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          // Restore scroll position after state update
          window.scrollTo(0, this.scrollPosition);
        }
      );

      if (this.props.onChange && typeof this.props.onChange === "function") {
        this.props.onChange(selectedItems, this.state.name);
      }
    } else {
      if (
        window.hasOwnProperty("ttsObjPro") &&
        !ttsObjPro.is_pro_active &&
        selectedItems.length === selectionLimit
      ) {
        toast(
          <h6>
            {this.state.toastMessage} Please{" "}
            <a
              target="_blank"
              href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
            >
              buy pro version
            </a>
          </h6>,
          "info",
          { autoClose: 10000 }
        );
        return;
      }

      for (let i = 0; i < selectedItems.length; i++) {
        if (value === selectedItems[i]) {
          selectedItems.splice(i, 1);

          this.setState(
            {
              selectedItems: selectedItems,
            },
            () => {
              // Restore scroll position after state update
              window.scrollTo(0, this.scrollPosition);
            }
          );

          if (
            this.props.onChange &&
            typeof this.props.onChange === "function"
          ) {
            this.props.onChange(selectedItems, this.state.name);
          }
          return;
        }
      }
      selectedItems.push(value);
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          // Restore scroll position after state update
          window.scrollTo(0, this.scrollPosition);
        }
      );

      if (this.props.onChange && typeof this.props.onChange === "function") {
        this.props.onChange(selectedItems, this.state.name);
      }
    }
  };

  handleClick = (event) => {
    // Save scroll position before any state changes
    this.scrollPosition = window.scrollY;

    if (event && event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    // IMPORTANT: Prevent focus on the element
    event.target.blur();

    const selectedItems = [...(this.state.selectedItems || [])];
    const value = event.target.innerText;

    if (selectedItems.length === 0) {
      selectedItems.push(value);
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          // Restore scroll position after state update
          window.scrollTo(0, this.scrollPosition);
        }
      );

      if (this.props.onChange && typeof this.props.onChange === "function") {
        this.props.onChange(selectedItems, this.state.name);
      }
    } else {
      for (let i = 0; i < selectedItems.length; i++) {
        if (value === selectedItems[i]) {
          selectedItems.splice(i, 1);
          this.setState(
            {
              selectedItems: selectedItems,
            },
            () => {
              // Restore scroll position after state update
              window.scrollTo(0, this.scrollPosition);
            }
          );

          if (
            this.props.onChange &&
            typeof this.props.onChange === "function"
          ) {
            this.props.onChange(selectedItems, this.state.name);
          }
          return;
        }
      }
      selectedItems.push(value);
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          // Restore scroll position after state update
          window.scrollTo(0, this.scrollPosition);
        }
      );

      if (this.props.onChange && typeof this.props.onChange === "function") {
        this.props.onChange(selectedItems, this.state.name);
      }
    }
  };

  checkStatus = (item) => {
    const selectedItems = this.state?.selectedItems || [];
    return selectedItems.some((element) => element === item);
  };

  toggleDropdown = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.scrollPosition = window.scrollY;

    this.setState(
      (prevState) => ({
        isFocused: !prevState.isFocused,
      }),
      () => {
        // Restore scroll position after state update
        setTimeout(() => {
          window.scrollTo(0, this.scrollPosition);
        }, 0);
      }
    );
  };

  handleWrapperClick = (event) => {
    this.scrollPosition = window.scrollY;
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropdown(event);
  };

  handleClickOutside = (event) => {
    if (
      this.wrapperRef.current &&
      !this.wrapperRef.current.contains(event.target)
    ) {
      this.scrollPosition = window.scrollY;
      this.setState(
        {
          isFocused: false,
        },
        () => {
          // Restore scroll position after state update
          setTimeout(() => {
            window.scrollTo(0, this.scrollPosition);
          }, 0);
        }
      );
    }
  };

  renderDropdown = () => {
    const { inputValue } = this.state;

    return isObject(inputValue)
      ? Object.keys(inputValue).map((id, index) => (
          <React.Fragment key={`${id}-${index}`}>
            <input
              id={id}
              type="checkbox"
              value={id}
              onChange={this.handleChange}
              checked={this.checkStatus(id)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Prevent focus
                e.target.blur();
              }}
              onFocus={(e) => {
                e.preventDefault();
                e.target.blur();
              }}
              className="multiselect-checkbox"
            />
            <label
              htmlFor={id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger the checkbox click
                document.getElementById(id).click();
              }}
            >
              {inputValue[id]}
            </label>
          </React.Fragment>
        ))
      : (inputValue || []).map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            <input
              id={`multiselect-${item}-${index}`}
              type="checkbox"
              value={item}
              onChange={this.handleChange}
              checked={this.checkStatus(item)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Prevent focus
                e.target.blur();
              }}
              onFocus={(e) => {
                e.preventDefault();
                e.target.blur();
              }}
              className="multiselect-checkbox"
            />
            <label
              htmlFor={`multiselect-${item}-${index}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger the checkbox click
                document.getElementById(`multiselect-${item}-${index}`).click();
              }}
            >
              {item}
            </label>
          </React.Fragment>
        ));
  };

  hydrateInput() {
    const items = this.state?.selectedItems || [];
    return items.length > 0
      ? items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="item-pill"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleClick(e);
            }}
            onMouseDown={(e) => {
              // Prevent focus on the pill
              e.preventDefault();
            }}
          >
            {item}
          </span>
        ))
      : "Select Items...";
  }

  componentDidMount() {
    // Add event listener for clicking outside
    document.addEventListener("mousedown", this.handleClickOutside);
    document.addEventListener("touchstart", this.handleClickOutside, {
      passive: false,
    });

    // Save initial scroll position
    this.scrollPosition = window.scrollY;
  }

  componentWillUnmount() {
    // Clean up event listeners
    document.removeEventListener("mousedown", this.handleClickOutside);
    document.removeEventListener("touchstart", this.handleClickOutside);
  }

  componentDidUpdate(prevProps) {
    // Update selectedItems if props changed
    if (
      JSON.stringify(this.props.selectedItems) !==
      JSON.stringify(prevProps.selectedItems)
    ) {
      this.setState({
        selectedItems: this.props.selectedItems || [],
      });
    }
  }

  render() {
    const { isFocused } = this.state;

    return (
      <div
        className="multiselect-wrapper"
        ref={this.wrapperRef}
        onClick={this.handleWrapperClick}
        onMouseDown={(e) => {
          // Prevent focus on the wrapper
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.scrollPosition = window.scrollY;
        }}
      >
        <div
          className="select-input"
          onClick={this.handleWrapperClick}
          onMouseDown={(e) => {
            // Prevent focus
            e.preventDefault();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            this.scrollPosition = window.scrollY;
          }}
        >
          {this.hydrateInput()}
        </div>

        {isFocused && (
          <div
            className="select-dropdown shown"
            ref={this.dropdownRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
          >
            {this.renderDropdown()}
          </div>
        )}
      </div>
    );
  }
}

export { MultiSelect };

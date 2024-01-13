import './multiselect.css'
class MultiSelect extends React.Component {
    constructor(props) {
        super(props);
        console.log(props)
        this.state = {
            selectedItems: props.selectedItems,
            expanded: true,
            inputValue: props.options,
            isFocused: false,
            id: props.id,
            name: props.name,
            onChange: props.onChange
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);
        this.hydrateInput = this.hydrateInput.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
    }

    handleChange = (event) => {
        event.preventDefault()
        const selectedItems = this.state.selectedItems;
        const value = event.target.value;

        if (selectedItems.length === 0) {
            selectedItems.push(value);
            this.setState({
                selectedItems: selectedItems,
            });
            this.props.onChange(selectedItems)

        } else {
            for (let i = 0; i < selectedItems.length; i++) {
                if (value === selectedItems[i]) {
                    selectedItems.splice(i, 1);

                    this.setState({
                        selectedItems: selectedItems,
                    });
                    this.props.onChange(selectedItems)
                    return;
                }
            }
            selectedItems.push(value);
            this.setState({
                selectedItems: selectedItems,
            });
            this.props.onChange(selectedItems)

        }
    }

    handleClick = (event) => {
        event.preventDefault();
        const selectedItems = this.state.selectedItems;
        const value = event.target.innerText;

        if (selectedItems.length === 0) {
            selectedItems.push(value);
            this.setState({
                selectedItems: selectedItems,
            });
            this.props.onChange(selectedItems)

        } else {
            for (let i = 0; i < selectedItems.length; i++) {
                if (value === selectedItems[i]) {
                    selectedItems.splice(i, 1);
                    this.setState({
                        selectedItems: selectedItems,
                    });
                    this.props.onChange(selectedItems)
                    return;
                }
            }
            selectedItems.push(value);
            this.setState({
                selectedItems: selectedItems,
            });
            this.props.onChange(selectedItems)

        }
    }

    checkStatus = (item) => {
        const status = this.state.selectedItems.some(element => {
            return element === item;
        });

        return status;
    }

    renderDropdown = () => {
        const { inputValue } = this.state;
        return (
            inputValue.map((item, index) => (
                <React.Fragment key={`${item}-${index} `}>
                    <input id={item} type="checkbox" value={item} onChange={this.handleChange} ref={input => this[`checkbox${item}`] = input} checked={this.checkStatus(item)} />
                    <label htmlFor={item}>{item}</label>
                </React.Fragment>
            ))
        );
    }

    hydrateInput() {
        const items = this.state.selectedItems;
        return (
            items.length > 0 ?
                items.map((item, index) => (
                    /* eslint-disable */
                    <span key={`${item}-${index} `} className="item-pill" onClick={this.handleClick}>
                        {item}
                    </span>
                    /* eslint-enable */
                )) :
                'Select Items...'
        );
    }

    componentDidMount() {
        let { isFocused } = this.state
        let self = this;
        let selectItem = document.getElementsByClassName('select-input')[0]
        selectItem.addEventListener('click', function (e) {
            e.preventDefault()
            if (isFocused) {
                self.setState({
                    isFocused: false
                })
            } else {
                self.setState({
                    isFocused: true
                })
            }

        })

        let multiselectwrapper = document.getElementsByClassName('multiselect-wrapper')[0]
        multiselectwrapper.addEventListener('mousemove ', function (e) {
            e.preventDefault()
            self.setState({
                isFocused: false
            })
        })


    }




    render() {
        const { isFocused } = this.state;

        return (
            <div className="multiselect-wrapper">
                <div className={'select-input'}>
                    {this.hydrateInput()}
                </div>

                {
                    isFocused && <div className="select-dropdown shown">
                        {this.renderDropdown()}
                    </div>
                }
            </div>
        );
    }
}








export {
    MultiSelect
};

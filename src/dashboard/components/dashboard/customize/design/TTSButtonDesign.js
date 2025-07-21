import { Form } from 'react-bootstrap';

export default function TTSButtonDesign({ handleChange, customCSS, listeningBtnStyle }) {
    return (
        <>
            <div className="d-flex flex-row justify-content-between pb-3 border-bottom  border-dark ">
                <div>
                    <Form.Label className={'font-weight-bold'} htmlFor='backgroundColor'>
                        Background Color
                    </Form.Label>
                    <Form.Control
                        type='color'
                        name='backgroundColor'
                        onChange={handleChange}
                        id='backgroundColor'
                        value={listeningBtnStyle.backgroundColor}
                        title='Choose player background color'
                    />
                </div>
                <div>
                    <Form.Label className="font-weight-bold" htmlFor='color'>Text Color</Form.Label>
                    <Form.Control
                        type='color'
                        name='color'
                        onChange={handleChange}
                        id='color'
                        value={listeningBtnStyle.color}
                        title='Choose your color'
                    />
                </div>
            </div>
            <div className="d-flex flex-row justify-content-between pb-3 border-bottom  border-dark ">
                <div>
                    <Form.Label className={'font-weight-bold'} htmlFor='hoverBackgroundColor'>
                        Hover Background Color
                    </Form.Label>
                    <Form.Control
                        type='color'
                        name='hoverBackgroundColor'
                        onChange={handleChange}
                        id='hoverBackgroundColor'
                        value={listeningBtnStyle.hoverBackgroundColor}
                        title='Choose your hover background color'
                    />
                </div>
            </div>
            <div className="d-flex flex-row justify-content-between py-3 border-bottom border-dark ">
                <div>
                    <Form.Label className={'font-weight-bold'} htmlFor='marginTop'>
                        Margin Top  (px)
                    </Form.Label>
                    <Form.Control
                        type='number'
                        name='marginTop'
                        onChange={handleChange}
                        id='marginTop'
                        value={listeningBtnStyle.marginTop}
                        title='Margin Top'
                        className={'w-75'}
                    />
                </div>
                <div>
                    <Form.Label className="font-weight-bold" htmlFor='color'>Margin Bottom (px)</Form.Label>
                    <Form.Control
                        type='number'
                        name='marginBottom'
                        onChange={handleChange}
                        id='marginBottom'
                        value={listeningBtnStyle.marginBottom}
                        title='Margin Bottom'
                        className={'w-75'}
                    />
                </div>
            </div>
            <div className="d-flex flex-row justify-content-between py-3 border-bottom border-dark ">
                <div>
                    <Form.Label className={'font-weight-bold'} htmlFor='marginLeft'>
                        Margin Left (%)
                    </Form.Label>
                    <Form.Control
                        type='number'
                        name='marginLeft'
                        onChange={handleChange}
                        id='marginLeft'
                        value={listeningBtnStyle.marginLeft}
                        title='Margin Left'
                        className={'w-75'}
                    />
                </div>
                <div>
                    <Form.Label className="font-weight-bold" htmlFor='marginRight'>Margin Right (px)</Form.Label>
                    <Form.Control
                        type='number'
                        name='marginRight'
                        onChange={handleChange}
                        id='marginRight'
                        value={listeningBtnStyle.marginRight}
                        title='Margin Right'
                        className={'w-75'}
                    />
                </div>
            </div>
            <Form.Label className={' pt-3 font-weight-bold'} htmlFor='width'>
                Button Width (%)
            </Form.Label>
            <Form.Control
                type='number'
                name='width'
                onChange={handleChange}
                id='width'
                min={'0'}
                max='100'
                value={listeningBtnStyle.width}
                title='Button Width'
            />
            {
                listeningBtnStyle?.buttonSettings?.id == 1 && <>
                    <div className="d-flex flex-row justify-content-between py-3 border-bottom border-dark ">
                        <div>
                            <Form.Label className={'font-weight-bold'} htmlFor='fontSize'>
                                Font Size (px)
                            </Form.Label>
                            <Form.Control
                                type='number'
                                name='fontSize'
                                onChange={handleChange}
                                id='fontSize'
                                min={'0'}
                                max='100'
                                value={listeningBtnStyle.fontSize}
                                title='Font size'
                            /></div>
                        <div>
                            <Form.Label className={'font-weight-bold'} htmlFor='height'>
                                Button Height (px)
                            </Form.Label>
                            <Form.Control
                                type='number'
                                name='height'
                                onChange={handleChange}
                                id='height'
                                min={'0'}
                                max='200'
                                value={listeningBtnStyle.height}
                                title='Button height'
                            />
                        </div>
                    </div>
                    <div className="d-flex flex-row justify-content-between py-3 border-bottom border-dark ">
                        <div>
                            <Form.Label className={'font-weight-bold'} htmlFor='border_color'>
                                Border Color
                            </Form.Label>
                            <Form.Control
                                type='color'
                                name='border_color'
                                onChange={handleChange}
                                id='border_color'
                                value={listeningBtnStyle.border_color}
                                title='Border Color'
                            />
                        </div>
                        <div>
                            <Form.Label className={'font-weight-bold'} htmlFor='border'>
                                Button Border (px)
                            </Form.Label>
                            <Form.Control
                                type='number'
                                name='border'
                                onChange={handleChange}
                                id='border'
                                min={'0'}
                                max='20'
                                value={listeningBtnStyle.border}
                                title='Button border'
                            />
                        </div>
                    </div>
                    <div className="d-flex flex-row justify-content-between py-3 border-bottom border-dark ">
                        <div>
                            <Form.Label className={'font-weight-bold'} htmlFor='borderRadius'>
                                Button Border Radius (px)
                            </Form.Label>
                            <Form.Control
                                type='number'
                                name='borderRadius'
                                onChange={handleChange}
                                id='borderRadius'
                                min={'0'}
                                max='200'
                                value={listeningBtnStyle.borderRadius}
                                title='Button border radius'
                            />
                        </div>
                    </div>

                </>
            }

            <Form.Label className={'font-weight-bold'} htmlFor='custom_css'>Custom CSS</Form.Label>
            <Form.Control
                as='textarea'
                name='custom_css'
                id='custom_css'
                onChange={handleChange}
                value={customCSS ? customCSS : ''}
                placeholder='Custom CSS'
            />
        </>
    )
}
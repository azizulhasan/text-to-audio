import {Form} from 'react-bootstrap';

export default function TTSButtonDesign({handleChange, customCSS, listeningBtnStyle}) {
    return (
        <>
            <Form.Label className={'font-weight-bold'} htmlFor='backgroundColor'>
                BackGround Color
            </Form.Label>
            <Form.Control
                type='color'
                name='backgroundColor'
                onChange={handleChange}
                id='backgroundColor'
                value={listeningBtnStyle.backgroundColor}
                title='Choose your color'
            />
            <Form.Label className={'pt-3 font-weight-bold'} htmlFor='color'>Text Color</Form.Label>
            <Form.Control
                type='color'
                name='color'
                onChange={handleChange}
                id='color'
                value={listeningBtnStyle.color}
                title='Choose your color'
            />
            <Form.Label className={'pt-3 font-weight-bold'} htmlFor='width'>
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
                    <Form.Label className={'pt-3 font-weight-bold'} htmlFor='font-size'>
                        Font Size (px)
                    </Form.Label>
                    <Form.Control
                        type='number'
                        name='font-size'
                        onChange={handleChange}
                        id='font-size'
                        min={'0'}
                        max='100'
                        value={listeningBtnStyle['font-size']}
                        title='Font size'
                    />
                    <Form.Label className={'pt-3 font-weight-bold'} htmlFor='height'>
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
                    <Form.Label className={'pt-3 font-weight-bold'} htmlFor='border_color'>
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
                    <Form.Label className={'pt-3 font-weight-bold'} htmlFor='border'>
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
                </>
            }

            <Form.Label className={'pt-3 font-weight-bold'} htmlFor='custom_css'>Custom CSS</Form.Label>
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
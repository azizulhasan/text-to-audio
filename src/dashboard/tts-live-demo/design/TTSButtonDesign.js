import { Form } from 'react-bootstrap';
export default function TTSButtonDesign({ handleChange, customCSS, demoSettings }) {
    return (
        <>
            <Form.Label htmlFor='backgroundColor'>
                BackGround Color
            </Form.Label>
            <Form.Control
                type='color'
                name='backgroundColor'
                onChange={handleChange}
                id='backgroundColor'
                value={demoSettings.backgroundColor}
                title='Choose your color'
            />
            <Form.Label htmlFor='color'>Text Color</Form.Label>
            <Form.Control
                type='color'
                name='color'
                onChange={handleChange}
                id='color'
                value={demoSettings.color}
                title='Choose your color'
            />
            <Form.Label htmlFor='width'>
                Button Width (%)
            </Form.Label>
            <Form.Control
                type='number'
                name='width'
                onChange={handleChange}
                id='width'
                min={'0'}
                max='100'
                value={demoSettings.width}
                title='Button Width'
            />
            <Form.Label htmlFor='custom_css'>Custom CSS</Form.Label>
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
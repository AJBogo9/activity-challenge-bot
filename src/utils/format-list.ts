const formatNumber = (num: number): string => {
    const fixed = num.toFixed(1)
    return fixed.endsWith('.0') ? Math.round(num).toString() : fixed
}

export const formatList = (title: string, text: string | number, titlePadding: number, valuePadding: number, unit = ''): string => {
    let textStr: string;
    
    if (typeof text === 'number') {
        textStr = formatNumber(text);
    } else if (!isNaN(parseFloat(text)) && text.trim() !== '') {
        textStr = formatNumber(parseFloat(text));
    } else {
        textStr = text;
    }
    
    title = title.padEnd(titlePadding, ' ')
    textStr = textStr.padStart(valuePadding, ' ')
    
    const formattedUnit = unit ? ` ${unit}` : ''
    const escapedTitle = escapeMarkdown(title)
    const escapedText = escapeMarkdown(textStr)
    return `\`${escapedTitle}${escapedText}\`${formattedUnit}`
}

export const escapeMarkdown = (text: string | number): string => {
    if (typeof text === 'number') { text = formatNumber(text) }
    else if (typeof text === 'string' && !isNaN(parseFloat(text)) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }
    return (text as string).replace(/[[\]()~`>#+-=|{}.!\\]/g, (x) => '\\' + x)
}
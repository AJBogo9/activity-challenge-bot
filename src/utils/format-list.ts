const formatNumber = (num: number): string => {
    const fixed = num.toFixed(1)
    return fixed.endsWith('.0') ? Math.round(num).toString() : fixed
}

export const formatList = (title: string, text: string | number, titlePadding: number, valuePadding: number, unit = ''): string => {
    if (typeof text === 'number') { text = formatNumber(text) }
    else if (typeof text === 'string' && !isNaN(parseFloat(text)) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    title = title.padEnd(titlePadding, ' ')
    // @ts-ignore
    text = text.toString().padStart(valuePadding, ' ')
    const formattedUnit = unit ? ` ${unit}` : ''
    const escapedTitle = escapeMarkdown(title)
    const escapedText = escapeMarkdown(text as string)
    return `\`${escapedTitle}${escapedText}\`${formattedUnit}`
}

export const escapeMarkdown = (text: string | number): string => {
    if (typeof text === 'number') { text = formatNumber(text) }
    else if (typeof text === 'string' && !isNaN(parseFloat(text)) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    return (text as string).replace(/[[\]()~`>#+-=|{}.!\\]/g, (x) => '\\' + x)
}
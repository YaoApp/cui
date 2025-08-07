// 文件类型图标统一导出
import pdf from './pdf.svg'
import doc from './doc.svg'
import docx from './docx.svg'
import xls from './xls.svg'
import xlsx from './xlsx.svg'
import ppt from './ppt.svg'
import pptx from './pptx.svg'
import txt from './txt.svg'
import csv from './csv.svg'
import json from './json.svg'
import xml from './xml.svg'
import html from './html.svg'
import css from './css.svg'
import js from './js.svg'
import py from './py.svg'
import java from './java.svg'
import c from './c.svg'
import h from './h.svg'
import php from './php.svg'
import zip from './zip.svg'
import rar from './rar.svg'
import sevenZ from './7z.svg'
import jpg from './jpg.svg'
import jpeg from './jpeg.svg'
import png from './png.svg'
import gif from './gif.svg'
import bmp from './bmp.svg'
import svg from './svg.svg'
import mp3 from './mp3.svg'
import mp4 from './mp4.svg'
import avi from './avi.svg'
import mov from './mov.svg'
import mkv from './mkv.svg'
import wav from './wav.svg'
import exe from './exe.svg'
import dll from './dll.svg'
import db from './db.svg'
import eps from './eps.svg'
import psd from './psd.svg'
import ai from './ai.svg'
import flv from './flv.svg'
import wmv from './wmv.svg'
import wma from './wma.svg'
import rtf from './rtf.svg'
import bat from './bat.svg'
import cmd from './cmd.svg'
import cs from './cs.svg'
import jsp from './jsp.svg'
import lib from './lib.svg'
import mdb from './mdb.svg'
import mdf from './mdf.svg'
import mpeg from './mpeg.svg'
import raw from './raw.svg'
import rm from './rm.svg'
import rmvb from './rmvb.svg'
import tiff from './tiff.svg'
import tmp from './tmp.svg'
import vob from './vob.svg'
import wdb from './wdb.svg'
import wps from './wps.svg'
import xd from './xd.svg'
import aac from './aac.svg'
import aep from './aep.svg'
import aspx from './aspx.svg'
import bak from './bak.svg'
import dbf from './dbf.svg'
import dot from './dot.svg'
import htm from './htm.svg'
import m4v from './m4v.svg'
import threegp from './3gp.svg'

// 文件类型图标映射
export const fileTypeIcons: Record<string, string> = {
	// 文档类
	pdf,
	doc,
	docx,
	xls,
	xlsx,
	ppt,
	pptx,
	txt,
	csv,
	rtf,
	wps,
	dot,

	// 数据类
	json,
	xml,
	db,
	mdb,
	dbf,
	wdb,

	// 网页类
	html,
	htm,
	css,
	js,
	jsp,
	aspx,
	php,

	// 编程类
	py,
	java,
	c,
	cpp: c, // cpp 使用 c 图标
	h,
	cs,

	// 压缩类
	zip,
	rar,
	'7z': sevenZ,
	gz: sevenZ,
	tar: sevenZ,

	// 图片类
	jpg,
	jpeg,
	png,
	gif,
	bmp,
	svg,
	psd,
	ai,
	eps,
	raw,
	tiff,

	// 音频类
	mp3,
	wav,
	wma,
	aac,

	// 视频类
	mp4,
	avi,
	mov,
	mkv,
	flv,
	wmv,
	mpeg,
	rm,
	rmvb,
	vob,
	m4v,
	'3gp': threegp,

	// 系统类
	exe,
	dll,
	bat,
	cmd,
	lib,
	tmp,
	bak,

	// 其他
	aep,
	xd,
	mdf
}

// 获取文件类型图标
export const getFileTypeIcon = (fileName: string): string => {
	const ext = fileName.split('.').pop()?.toLowerCase()
	return fileTypeIcons[ext || ''] || txt // 默认使用 txt 图标
}

// 默认导出
export default fileTypeIcons

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface CaptionSettings {
    enabled: boolean;
    position: 'top' | 'bottom' | 'center';
    fontSize: number;
    textColor: string;
    textOpacity: number;
    bgColor: string;
    bgOpacity: number;
    padding: number;
    maxWidthRatio: number;
    fontFamily: string;
}

export const defaultCaptionSettings: CaptionSettings = {
    enabled: true,
    position: 'bottom',
    fontSize: 40,
    textColor: '#FFFFFF',
    textOpacity: 255,
    bgColor: '#000000',
    bgOpacity: 180,
    padding: 20,
    maxWidthRatio: 0.9,
    fontFamily: 'default',
};

interface CaptionCustomizerProps {
    settings: CaptionSettings;
    onChange: (settings: CaptionSettings) => void;
    previewCaption?: string;
}

export default function CaptionCustomizer({ settings, onChange, previewCaption }: CaptionCustomizerProps) {
    const updateSetting = <K extends keyof CaptionSettings>(key: K, value: CaptionSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Caption Embedding</CardTitle>
                        <CardDescription>Customize how captions appear on your images</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="caption-toggle">Enable Caption</Label>
                        <Switch
                            id="caption-toggle"
                            checked={settings.enabled}
                            onCheckedChange={(checked: boolean) => updateSetting('enabled', checked)}
                        />
                    </div>
                </div>
            </CardHeader>

            {settings.enabled && (
                <CardContent>
                    <Tabs defaultValue="layout" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="layout">Layout</TabsTrigger>
                            <TabsTrigger value="text">Text Style</TabsTrigger>
                            <TabsTrigger value="background">Background</TabsTrigger>
                        </TabsList>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Position</Label>
                                <Select value={settings.position} onValueChange={(value: 'top' | 'bottom' | 'center') => updateSetting('position', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top">Top</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="bottom">Bottom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Font Size: {settings.fontSize}px</Label>
                                <Slider
                                    value={[settings.fontSize]}
                                    onValueChange={([value]: number[]) => updateSetting('fontSize', value)}
                                    min={20}
                                    max={100}
                                    step={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Padding: {settings.padding}px</Label>
                                <Slider
                                    value={[settings.padding]}
                                    onValueChange={([value]: number[]) => updateSetting('padding', value)}
                                    min={10}
                                    max={50}
                                    step={5}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Text Width: {Math.round(settings.maxWidthRatio * 100)}%</Label>
                                <Slider
                                    value={[settings.maxWidthRatio * 100]}
                                    onValueChange={([value]: number[]) => updateSetting('maxWidthRatio', value / 100)}
                                    min={50}
                                    max={100}
                                    step={5}
                                />
                            </div>
                        </TabsContent>

                        {/* Text Style Tab */}
                        <TabsContent value="text" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Font Family</Label>
                                <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default (Emoji Support)</SelectItem>
                                        <SelectItem value="arial">Arial</SelectItem>
                                        <SelectItem value="segoe">Segoe UI</SelectItem>
                                        <SelectItem value="emoji">Segoe UI Emoji</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Text Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.textColor}
                                        onChange={(e) => updateSetting('textColor', e.target.value)}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={settings.textColor}
                                        onChange={(e) => updateSetting('textColor', e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Text Opacity: {Math.round((settings.textOpacity / 255) * 100)}%</Label>
                                <Slider
                                    value={[settings.textOpacity]}
                                    onValueChange={([value]: number[]) => updateSetting('textOpacity', value)}
                                    min={0}
                                    max={255}
                                    step={5}
                                />
                            </div>
                        </TabsContent>

                        {/* Background Tab */}
                        <TabsContent value="background" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.bgColor}
                                        onChange={(e) => updateSetting('bgColor', e.target.value)}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={settings.bgColor}
                                        onChange={(e) => updateSetting('bgColor', e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Background Opacity: {Math.round((settings.bgOpacity / 255) * 100)}%</Label>
                                <Slider
                                    value={[settings.bgOpacity]}
                                    onValueChange={([value]: number[]) => updateSetting('bgOpacity', value)}
                                    min={0}
                                    max={255}
                                    step={5}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Preview */}
                    {previewCaption && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border">
                            <Label className="text-xs text-slate-600 mb-2 block">Preview</Label>
                            <div
                                className="relative w-full h-32 bg-gradient-to-br from-slate-300 to-slate-400 rounded overflow-hidden flex items-center justify-center"
                                style={{
                                    alignItems: settings.position === 'top' ? 'flex-start' : settings.position === 'bottom' ? 'flex-end' : 'center',
                                }}
                            >
                                <div
                                    className="w-full text-center"
                                    style={{
                                        backgroundColor: `${settings.bgColor}${Math.round((settings.bgOpacity / 255) * 100).toString(16).padStart(2, '0')}`,
                                        color: `${settings.textColor}${Math.round((settings.textOpacity / 255) * 100).toString(16).padStart(2, '0')}`,
                                        fontSize: `${Math.max(12, settings.fontSize / 3)}px`,
                                        padding: `${settings.padding / 2}px`,
                                        maxWidth: `${settings.maxWidthRatio * 100}%`,
                                    }}
                                >
                                    {previewCaption}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

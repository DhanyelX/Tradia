import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context';
import { Avatar, XMarkIcon, UploadIcon, TrashIcon, CheckCircleIcon } from './Icons';

const AVATAR_STYLES = [
    { id: 'adventurer', name: 'Adventurer' },
    { id: 'pixel-art', name: 'Pixel Art' },
    { id: 'micah', name: 'Micah' },
    { id: 'bottts', name: 'Bottts' },
    { id: 'initials', name: 'Initials' },
];

const AVATAR_SEEDS = [
    'Max', 'Leo', 'Zoe', 'Mia', 'Jack', 'Luna', 'Felix', 'Ruby', 
    'Oscar', 'Ivy', 'Toby', 'Lily', 'Sam', 'Chloe', 'Ben', 'Nora'
];

const secondaryButtonStyles = "px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-800 dark:text-slate-200 text-sm transition-colors";

export const AvatarSelectionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, updateUser, updateAvatar, removeAvatar } = useAppContext();
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitialStyle = () => {
        const currentUrl = user?.avatar_url || '';
        for (const style of AVATAR_STYLES) {
            if (currentUrl.includes(`/8.x/${style.id}/`)) {
                return style.id;
            }
        }
        return 'adventurer'; // Default style
    };

    const [selectedStyle, setSelectedStyle] = useState(getInitialStyle);

    const avatarOptions = useMemo(() => {
        return AVATAR_SEEDS.map(seed => `https://api.dicebear.com/8.x/${selectedStyle}/svg?seed=${seed}`);
    }, [selectedStyle]);


    const handleSave = async () => {
        if (selectedAvatar !== user?.avatar_url) {
            await updateUser({ avatar_url: selectedAvatar });
        }
        onClose();
    };
    
    const handleRemove = async () => {
        await removeAvatar();
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await updateAvatar(file);
        } catch (error) {
            console.error("Failed to upload avatar:", error);
        } finally {
            setIsUploading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Choose Your Avatar</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200">Select a preset avatar</h4>
                        <div>
                            <label htmlFor="style-select" className="sr-only">Avatar Style</label>
                            <select 
                                id="style-select" 
                                value={selectedStyle} 
                                onChange={e => setSelectedStyle(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-accent-500"
                            >
                                {AVATAR_STYLES.map(style => (
                                    <option key={style.id} value={style.id}>{style.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {avatarOptions.map(url => (
                            <button key={url} onClick={() => setSelectedAvatar(url)} className={`relative rounded-full aspect-square transition-all duration-200 ${selectedAvatar === url ? 'ring-4 ring-accent-500 ring-offset-2 dark:ring-offset-slate-800' : 'hover:scale-110'}`}>
                                <Avatar avatar_url={url} className="w-full h-full" />
                                {selectedAvatar === url && (
                                    <div className="absolute -bottom-1 -right-1 bg-accent-500 text-white rounded-full p-0.5">
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-4">Or upload your own</h4>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg"
                                className="hidden"
                                disabled={isUploading}
                            />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`${secondaryButtonStyles} w-full sm:w-auto flex items-center justify-center gap-2`}>
                                <UploadIcon className="w-4 h-4" />
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </button>
                            {user?.avatar_url && !user.avatar_url.includes('api.dicebear.com') && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Current: Custom image</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                    <button onClick={handleRemove} className={`${secondaryButtonStyles} !bg-red-500/10 !text-red-500 hover:!bg-red-500/20 flex items-center gap-2`}>
                        <TrashIcon className="w-4 h-4"/>
                        Remove Avatar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 font-semibold">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
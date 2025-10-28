
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { Community, CommunityPost, Trade, Goal, UserStatsSnapshot, User } from '../types';
import { UsersIcon, PlusIcon, HeartIcon, ChatBubbleIcon, TrophyIcon, SendIcon, XMarkIcon, ShareIcon, DoorLeaveIcon, FlagIcon, CheckCircleIcon, EditIcon, TrashIcon, TrendingUpIcon, TrendingDownIcon, Avatar } from './Icons';

// MODAL COMPONENTS
const CreateCommunityModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addCommunity, setView } = useAppContext();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim() || isLoading) return;
        
        setIsLoading(true);
        setError('');

        try {
            const newCommunity = await addCommunity(name, description);
            if (newCommunity) {
                setView(`community/${newCommunity.id}`);
                onClose();
            } else {
                setError('Could not create community. Please ensure you are logged in.');
            }
        } catch (err: unknown) {
            let errorMessage = "An unknown error occurred. Please try again.";
            if (err && typeof err === 'object') {
                const errorObject = err as any;
                if (errorObject.code === '23505') {
                    errorMessage = 'A community with this name already exists. Please choose another name.';
                } else if (errorObject.code === '42501') {
                    errorMessage = "Permission Error: Could not create the community due to a database security policy (RLS).";
                } else if (typeof errorObject.message === 'string' && errorObject.message) {
                    errorMessage = errorObject.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-accent-500 focus:border-accent-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create a Private Community</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">All communities are private. After creation, you can share the unique Community ID to invite others.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="comm-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Community Name</label>
                        <input id="comm-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., London Session Scalpers" className={inputStyles} required />
                    </div>
                    <div>
                        <label htmlFor="comm-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea id="comm-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this community about?" className={inputStyles} required />
                    </div>
                    {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ShareModal: React.FC<{ communityId: string; onClose: () => void }> = ({ communityId, onClose }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(communityId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Community</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Share this ID with others to invite them.</p>
                <div className="my-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-lg">{communityId}</div>
                <button onClick={handleCopy} className="w-full px-4 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700">{copied ? 'Copied!' : 'Copy ID'}</button>
            </div>
        </div>
    );
};

const LeaveModal: React.FC<{ communityName: string; onConfirm: () => void; onClose: () => void }> = ({ communityName, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Leave Community?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 my-4">Are you sure you want to leave <span className="font-semibold">{communityName}</span>? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onClose} className="px-6 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Leave</button>
            </div>
        </div>
    </div>
);

// MAIN DISCOVER/HUB VIEW
const CommunityDiscover: React.FC = () => {
    const { communities, user, setView, joinCommunity } = useAppContext();
    const [joinByIdInput, setJoinByIdInput] = useState('');
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const joined = useMemo(() => {
        if (!user) return [];
        return communities.filter(c => c.community_members && c.community_members.some(m => m.user_id === user.id));
    }, [communities, user]);
    
    const handleJoinById = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const idToJoin = joinByIdInput.trim();
        if (!idToJoin) return;
        
        try {
            await joinCommunity(idToJoin);
            setView(`community/${idToJoin}`);
        } catch (err: unknown) {
            let errorMessage = "An unexpected error occurred while trying to join the community."; // Fallback message
            if (err && typeof err === 'object') {
                const errorObject = err as any;
                if (errorObject.code === '23503') { // foreign_key_violation
                    errorMessage = 'Community not found. Please check the ID and try again.';
                } else if (errorObject.code === '23505') { // unique_violation
                    errorMessage = 'You are already a member of this community.';
                } else if (errorObject.code === '42501') { // insufficient_privilege
                     errorMessage = "You don't have permission to join or view this community.";
                } else if (errorObject.code === 'PGRST116') {
                     errorMessage = "Community not found. The ID might be incorrect or it's a private community you haven't been invited to.";
                } else if (typeof errorObject.message === 'string' && errorObject.message) {
                    errorMessage = errorObject.message; // Use DB message as a fallback
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        }
    };
    
    const CommunityCard: React.FC<{community: Community; style?: React.CSSProperties}> = ({ community, style }) => {
        return (
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-white/10 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in-up" style={style}>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{community.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 my-1"><UsersIcon className="w-3 h-3"/> {community.community_members.length} Members</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{community.description}</p>
                </div>
                <button onClick={() => setView(`community/${community.id}`)} className="w-full mt-3 px-3 py-2 text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 rounded-md">
                    View
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-8">
                 {/* Join or Create Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                         <h3 className="text-lg font-semibold mb-2">Join with an ID</h3>
                        <form onSubmit={handleJoinById} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={joinByIdInput}
                                onChange={e => setJoinByIdInput(e.target.value)}
                                placeholder="Enter Community ID"
                                className="w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-white/10"
                            />
                            <button type="submit" className="px-4 py-2 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 flex-shrink-0">
                                Join
                            </button>
                        </form>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                     <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{animationDelay: '200ms'}}>
                        <h3 className="text-lg font-semibold">Start your own community</h3>
                         <button onClick={() => setIsCreateModalOpen(true)} className="mt-2 flex items-center justify-center mx-auto gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600">
                            <PlusIcon className="w-4 h-4" />
                            Create a New Community
                        </button>
                    </div>
                </div>

                {/* My Communities Section */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Communities</h2>
                    {joined.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {joined.map((c, index) => <CommunityCard key={c.id} community={c} style={{ animationDelay: `${index * 100}ms`}} />)}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 mt-2">You haven't joined any communities yet. Join one with an ID or create your own!</p>
                    )}
                </div>
            </div>
            {isCreateModalOpen && <CreateCommunityModal onClose={() => setIsCreateModalOpen(false)} />}
        </>
    );
};

// COMMUNITY DETAIL VIEW & TABS

const SharedTradePreview: React.FC<{ trade: Trade }> = ({ trade }) => {
    const isProfit = trade.pnl >= 0;
    const rr = useMemo(() => {
        if (!trade.entry || !trade.stop_loss || !trade.take_profit) return 'N/A';
        const risk = Math.abs(trade.entry - trade.stop_loss);
        const reward = Math.abs(trade.take_profit - trade.entry);
        return risk > 0 ? (reward/risk).toFixed(2) + 'R' : 'N/A';
    }, [trade]);

    return (
        <div className="border border-slate-200 dark:border-white/10 rounded-lg p-3 mt-2 bg-slate-50 dark:bg-slate-800/50">
            <p className="font-bold text-slate-800 dark:text-slate-200">{trade.instrument}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">P/L</span>
                    <p className={`font-semibold ${isProfit ? 'text-accent-500' : 'text-red-500'}`}>${trade.pnl.toFixed(2)}</p>
                </div>
                 <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">R:R</span>
                    <p className="font-semibold">{rr}</p>
                </div>
            </div>
            <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">"{trade.notes}"</p>
        </div>
    );
};

const PostCard: React.FC<{ post: CommunityPost; userMap: Map<string, User>; style?: React.CSSProperties }> = ({ post, userMap, style }) => {
    const { user, trades, toggleLike, addComment } = useAppContext();
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    
    const sharedTrade = useMemo(() => trades.find(t => t.id === post.shared_trade_id), [post.shared_trade_id, trades]);
    const hasLiked = useMemo(() => !!user && post.post_likes.includes(user.id), [post.post_likes, user]);
    const author = useMemo(() => userMap.get(post.author_id), [userMap, post.author_id]);
    const authorName = author?.name || `User ${post.author_id.substring(0, 8)}`;

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        await addComment(post.id, newComment);
        setNewComment('');
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5 animate-fade-in-up" style={style}>
            <div className="flex items-center gap-3">
                <Avatar avatar_url={author?.avatar_url} name={authorName} />
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{authorName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(post.timestamp).toLocaleString()}</p>
                </div>
            </div>
            <p className="my-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
            {sharedTrade && <SharedTradePreview trade={sharedTrade} />}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-accent-500 dark:hover:text-accent-400">
                    <HeartIcon className={hasLiked ? 'text-accent-500' : ''} fill={hasLiked ? 'currentColor' : 'none'} />
                    {post.post_likes.length}
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-accent-500 dark:hover:text-accent-400">
                    <ChatBubbleIcon />
                    {post.community_comments.length}
                </button>
            </div>
            {showComments && (
                <div className="mt-4 space-y-3 animate-fade-in">
                    {post.community_comments.map(comment => {
                        const commentAuthor = userMap.get(comment.author_id);
                        return (
                            <div key={comment.id} className="flex items-start gap-2">
                                <Avatar avatar_url={commentAuthor?.avatar_url} name={commentAuthor?.name} className="w-6 h-6 mt-1" />
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{commentAuthor?.name || 'User'}</p>
                                    <p className="text-slate-600 dark:text-slate-300">{comment.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    {user && (
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2">
                            <Avatar avatar_url={user.avatar_url} name={user.name} className="w-8 h-8"/>
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-white/10"
                            />
                            <button type="submit"><SendIcon className="text-accent-500" /></button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

const CommunityFeedTab: React.FC<{ community: Community; userMap: Map<string, User> }> = ({ community, userMap }) => {
    const { user, trades, posts, addPost } = useAppContext();
    const [postContent, setPostContent] = useState('');
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

    const communityPosts = useMemo(() => posts.filter(p => p.community_id === community.id), [posts, community.id]);
    const userTrades = useMemo(() => trades.filter(t => t.user_id === user?.id && t.trade_taken), [trades, user]);

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent.trim() || !user) return;
        await addPost({
            community_id: community.id,
            author_id: user.id,
            content: postContent,
            shared_trade_id: selectedTradeId || undefined,
        });
        setPostContent('');
        setSelectedTradeId(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5">
                <form onSubmit={handlePostSubmit}>
                    <textarea
                        value={postContent}
                        onChange={e => setPostContent(e.target.value)}
                        placeholder="Share your thoughts or a trade analysis..."
                        rows={3}
                        className="w-full bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-300 dark:border-white/10"
                    />
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-4">
                        <select
                            value={selectedTradeId || ''}
                            onChange={e => setSelectedTradeId(e.target.value)}
                            className="w-full sm:w-auto bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-white/10 text-sm"
                        >
                            <option value="">Attach a trade (optional)</option>
                            {userTrades.map(trade => (
                                <option key={trade.id} value={trade.id}>
                                    {trade.instrument} - {new Date(trade.exit_timestamp).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700">Post</button>
                    </div>
                </form>
            </div>
            {communityPosts.map((post, index) => <PostCard key={post.id} post={post} userMap={userMap} style={{animationDelay: `${index * 100}ms`}} />)}
        </div>
    );
};

const CommunityMembersTab: React.FC<{ community: Community; userMap: Map<string, User> }> = ({ community, userMap }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5">
        <h3 className="text-lg font-bold mb-4">{community.community_members.length} Members</h3>
        <div className="space-y-3">
            {community.community_members.map((member, index) => {
                const user = userMap.get(member.user_id);
                return (
                    <div key={member.user_id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                        <div className="flex items-center gap-3">
                            <Avatar avatar_url={user?.avatar_url} name={user?.name} />
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || `User ${member.user_id.substring(0,8)}`}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{member.role}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const GoalCard: React.FC<{ goal: Goal; communityId: string; canEdit: boolean }> = ({ goal, communityId, canEdit }) => {
    const { updateGoal, deleteGoal } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editDesc, setEditDesc] = useState(goal.description);

    const handleSave = () => {
        updateGoal(communityId, { ...goal, description: editDesc });
        setIsEditing(false);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-grow">
                <button
                    onClick={() => updateGoal(communityId, { ...goal, status: goal.status === 'Completed' ? 'In Progress' : 'Completed' })}
                    className="mt-1 flex-shrink-0"
                >
                    {goal.status === 'Completed' ? <CheckCircleIcon className="w-5 h-5 text-accent-500" /> : <FlagIcon className="w-5 h-5 text-slate-400" />}
                </button>
                {isEditing ? (
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-white dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-white/10" />
                ) : (
                    <p className={`text-slate-800 dark:text-slate-200 ${goal.status === 'Completed' && 'line-through text-slate-500 dark:text-slate-400'}`}>
                        {goal.description}
                    </p>
                )}
            </div>
            {canEdit && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                        <button onClick={handleSave} className="p-1.5 text-accent-500"><CheckCircleIcon className="w-5 h-5" /></button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-500"><EditIcon className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => deleteGoal(communityId, goal.id)} className="p-1.5 text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

const CommunityGoalsTab: React.FC<{ community: Community }> = ({ community }) => {
    const { user, addGoal } = useAppContext();
    const [newGoalDesc, setNewGoalDesc] = useState('');

    const canManageGoals = useMemo(() => {
        return community.community_members && community.community_members.some(m => m.user_id === user?.id && m.role === 'admin');
    }, [community, user]);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalDesc.trim()) return;
        await addGoal(community.id, { description: newGoalDesc, status: 'In Progress' });
        setNewGoalDesc('');
    };
    
    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5">
            <h3 className="text-lg font-bold mb-4">Community Goals</h3>
            <div className="space-y-3">
                {community.goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} communityId={community.id} canEdit={canManageGoals || goal.author_id === user?.id} />
                ))}
            </div>
            {canManageGoals && (
                <form onSubmit={handleAddGoal} className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                    <input
                        type="text"
                        value={newGoalDesc}
                        onChange={e => setNewGoalDesc(e.target.value)}
                        placeholder="Add a new goal..."
                        className="w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-white/10"
                    />
                    <button type="submit" className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700">Add Goal</button>
                </form>
            )}
        </div>
    );
};

const StatsCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {icon} {label}
        </div>
        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
    </div>
);

const CommunityStatsTab: React.FC<{ community: Community; userMap: Map<string, User> }> = ({ community, userMap }) => {
    const { user, shareStats, unshareStats } = useAppContext();
    
    const userHasShared = useMemo(() => community.user_stats_snapshots.some(s => s.user_id === user?.id), [community, user]);

    const sortedStats = useMemo(() => {
        return [...community.user_stats_snapshots].sort((a, b) => b.net_pnl - a.net_pnl);
    }, [community.user_stats_snapshots]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h3 className="text-lg font-bold">Community Stats Leaderboard</h3>
                    {userHasShared ? (
                        <button onClick={() => unshareStats(community.id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-md font-semibold text-sm">Stop Sharing My Stats</button>
                    ) : (
                        <button onClick={() => shareStats(community.id)} className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold text-sm">Share My Stats</button>
                    )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sharing your stats will post a snapshot of your current performance. You can un-share at any time.</p>
            </div>

            {sortedStats.map((stats, index) => {
                const statUser = userMap.get(stats.user_id);
                return (
                    <div key={stats.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-5 animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 w-8 text-center">#{index + 1}</span>
                            <Avatar avatar_url={statUser?.avatar_url} name={statUser?.name} />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{statUser?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Shared on {new Date(stats.shared_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <StatsCard label="Net P/L" value={`$${stats.net_pnl.toFixed(2)}`} icon={<TrendingUpIcon className={`w-4 h-4 ${stats.net_pnl >= 0 ? 'text-accent-500' : 'text-red-500'}`} />} />
                            <StatsCard label="Win Rate" value={`${stats.win_rate.toFixed(1)}%`} icon={<TrophyIcon className="w-4 h-4" />} />
                            <StatsCard label="Profit Factor" value={isFinite(stats.profit_factor) ? stats.profit_factor.toFixed(2) : '∞'} icon={<TrendingUpIcon className="w-4 h-4" />} />
                            <StatsCard label="Total Trades" value={stats.total_trades} icon={<UsersIcon className="w-4 h-4" />} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const CommunityDetail: React.FC<{ community: Community }> = ({ community }) => {
    const { user, users, setView, leaveCommunity } = useAppContext();
    const [activeTab, setActiveTab] = useState('feed');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    
    const handleLeave = async () => {
        await leaveCommunity(community.id);
        setIsLeaveModalOpen(false);
        setView('community');
    };

    const tabs = [
        { id: 'feed', label: 'Feed' },
        { id: 'members', label: 'Members' },
        { id: 'goals', label: 'Goals' },
        { id: 'stats', label: 'Stats' },
    ];

    return (
        <>
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{community.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{community.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-md font-semibold"><ShareIcon className="w-4 h-4"/> Share</button>
                        <button onClick={() => setIsLeaveModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 text-red-500 rounded-md font-semibold"><DoorLeaveIcon className="w-4 h-4"/> Leave</button>
                    </div>
                </div>
            </div>
            
            <div className="mb-6">
                <div className="flex items-center border-b border-slate-200 dark:border-white/10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-accent-500 text-accent-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div key={activeTab} className="animate-fade-in-up">
                {activeTab === 'feed' && <CommunityFeedTab community={community} userMap={userMap} />}
                {activeTab === 'members' && <CommunityMembersTab community={community} userMap={userMap} />}
                {activeTab === 'goals' && <CommunityGoalsTab community={community} />}
                {activeTab === 'stats' && <CommunityStatsTab community={community} userMap={userMap} />}
            </div>

            {isShareModalOpen && <ShareModal communityId={community.id} onClose={() => setIsShareModalOpen(false)} />}
            {isLeaveModalOpen && <LeaveModal communityName={community.name} onConfirm={handleLeave} onClose={() => setIsLeaveModalOpen(false)} />}
        </>
    );
};

const CommunityComponent: React.FC = () => {
    const { view, communities } = useAppContext();
    const viewParts = view.split('/');
    const communityId = viewParts.length > 1 ? viewParts[1] : null;

    const community = useMemo(() => {
        if (!communityId) return null;
        return communities.find(c => c.id === communityId);
    }, [communities, communityId]);
    
    if (communityId && community) {
        return <CommunityDetail community={community} />;
    }
    
    return <CommunityDiscover />;
};

export default CommunityComponent;

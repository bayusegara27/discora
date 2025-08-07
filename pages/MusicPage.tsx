import React from 'react';

const MusicPage: React.FC = () => {

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-text-primary">Music Player</h2>
                <p className="text-text-secondary mt-2">
                    Control music playback for your server's voice channels.
                </p>
            </div>

             <div className="bg-surface p-8 rounded-lg shadow-lg text-center">
                <h3 className="text-xl font-semibold text-text-primary">Feature Under Construction</h3>
                <p className="text-text-secondary mt-2">
                    The music player is a planned feature and is currently in development. Please check back later!
                </p>
             </div>
        </div>
    );
};

export default MusicPage;